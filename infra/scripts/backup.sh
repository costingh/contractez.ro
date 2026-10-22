#!/usr/bin/env sh
# Backup zilnic Contractez (pe VPS): baza de date + fișierele încărcate (avatare, coperte, portofolii, atașamente chat).
#   crontab: 15 3 * * * /opt/contractez/infra/scripts/backup.sh >> /var/log/contractez-backup.log 2>&1
#
# Copii locale în $BACKUP_DIR (implicit /root/backups/contractez), păstrate $KEEP_DAYS zile — protejează de greșeli
# (migrare stricată, ștergere accidentală). Dacă în /opt/contractez/.env există R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
# R2_SECRET_ACCESS_KEY și R2_BUCKET, copiile sunt urcate și în Cloudflare R2 (off-site: protejează și de pierderea VPS-ului).
#
# Restaurare (test periodic!):
#   gunzip -c db-AAAAMMZZ-HHMM.sql.gz | docker exec -i contractez-postgres-1 psql -U prestio -d prestio_restore
#   docker run --rm -v contractez_uploads:/data -v "$PWD":/b alpine tar -xzf /b/uploads-AAAAMMZZ-HHMM.tar.gz -C /data
set -eu

APP_DIR="${APP_DIR:-/opt/contractez}"
BACKUP_DIR="${BACKUP_DIR:-/root/backups/contractez}"
KEEP_DAYS="${KEEP_DAYS:-14}"
PG_CONTAINER="${PG_CONTAINER:-contractez-postgres-1}"
UPLOADS_VOLUME="${UPLOADS_VOLUME:-contractez_uploads}"
STAMP="$(date +%Y%m%d-%H%M)"
DB_FILE="$BACKUP_DIR/db-$STAMP.sql.gz"
UP_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# 1. Baza de date (dump consistent, fără proprietar — se poate restaura în altă bază).
docker exec "$PG_CONTAINER" pg_dump -U prestio -d prestio --no-owner --clean --if-exists | gzip -9 > "$DB_FILE.tmp"
# Un dump valid se termină cu mesajul de final al pg_dump; altfel nu înlocuim nimic.
gunzip -c "$DB_FILE.tmp" | tail -n 5 | grep -q "PostgreSQL database dump complete" || { echo "$(date -Iseconds) EROARE: dump incomplet"; rm -f "$DB_FILE.tmp"; exit 1; }
mv "$DB_FILE.tmp" "$DB_FILE"

# 2. Fișierele încărcate, direct din volum (nu depinde de containerul web).
docker run --rm -v "$UPLOADS_VOLUME":/data:ro alpine:3.20 tar -C /data -czf - . > "$UP_FILE.tmp"
mv "$UP_FILE.tmp" "$UP_FILE"
chmod 600 "$DB_FILE" "$UP_FILE"

# 3. Off-site în Cloudflare R2 (opțional, dacă sunt configurate cheile).
r2() { grep -E "^$1=" "$APP_DIR/.env" 2>/dev/null | head -n1 | cut -d= -f2- | sed 's/^"//; s/"$//'; }
R2_ACCOUNT_ID="$(r2 R2_ACCOUNT_ID)"; R2_ACCESS_KEY_ID="$(r2 R2_ACCESS_KEY_ID)"
R2_SECRET_ACCESS_KEY="$(r2 R2_SECRET_ACCESS_KEY)"; R2_BUCKET="$(r2 R2_BUCKET)"
OFFSITE="local"
if [ -n "$R2_ACCOUNT_ID" ] && [ -n "$R2_ACCESS_KEY_ID" ] && [ -n "$R2_SECRET_ACCESS_KEY" ] && [ -n "$R2_BUCKET" ]; then
  docker run --rm -v "$BACKUP_DIR":/backup:ro \
    -e RCLONE_CONFIG_R2_TYPE=s3 -e RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
    -e RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" -e RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    -e RCLONE_CONFIG_R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" -e RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true \
    rclone/rclone:1.68 copy /backup "r2:$R2_BUCKET/contractez" --include "*-$STAMP.*" --s3-no-check-bucket
  OFFSITE="R2 ($R2_BUCKET)"
fi

# 4. Rotație locală.
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Iseconds) backup OK → $OFFSITE: $(basename "$DB_FILE") $(du -h "$DB_FILE" | cut -f1), $(basename "$UP_FILE") $(du -h "$UP_FILE" | cut -f1)"
