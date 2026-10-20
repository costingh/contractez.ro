# syntax=docker/dockerfile:1.7
# Imagine unică pentru aplicație: `web` (Next.js standalone), `worker` (dist/worker.mjs), `migrate` (dist/migrate.mjs).

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# pnpm este descărcat o singură dată, în stratul de bază (refolosit de toate etapele).
RUN apk add --no-cache libc6-compat && corepack enable && corepack prepare pnpm@11.13.0 --activate && pnpm --version
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Variabilele NEXT_PUBLIC_* sunt incluse la build; restul sunt citite la runtime.
ARG NEXT_PUBLIC_APP_NAME=Contractez
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
RUN pnpm build && pnpm build:scripts

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 TZ=Europe/Bucharest \
    MIGRATIONS_DIR=/app/db/migrations UPLOAD_DIR=/data/uploads
RUN addgroup -S -g 1001 app && adduser -S -u 1001 -G app app \
  && mkdir -p /data/uploads && chown -R app:app /data
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/db/migrations ./db/migrations
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1
CMD ["node", "server.js"]
