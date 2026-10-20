#!/usr/bin/env sh
# Backup zilnic al bazei de date (rulează din directorul proiectului, pe VPS).
#   crontab -e  →  15 3 * * * cd /opt/prestio && ./infra/scripts/backup.sh >> /var/log/prestio-backup.log 2>&1
# Restaurare (test periodic!):
#   gunzip -c backups/prestio-AAAA-LL-ZZ_HHMM.sql.gz | docker compose exec -T postgres psql -U prestio -d prestio_restore
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y-%m-%d_%H%M)"
FILE="$BACKUP_DIR/prestio-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
docker compose exec -T postgres pg_dump -U prestio -d prestio --no-owner --clean --if-exists | gzip -9 > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"

# Fișierele încărcate (avatare, portofolii, atașamente) din volumul `uploads`.
docker compose exec -T web tar -C /data -czf - uploads > "$BACKUP_DIR/uploads-$STAMP.tar.gz" 2>/dev/null || true

find "$BACKUP_DIR" -name 'prestio-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Iseconds) backup OK: $FILE ($(du -h "$FILE" | cut -f1))"
