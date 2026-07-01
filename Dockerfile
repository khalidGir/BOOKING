# ── Stage 1: Build ────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY tsconfig.json prisma/ ./
RUN npx prisma generate

COPY src/ ./src/
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl && \
  addgroup -S app && adduser -S app -G app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/docs/openapi.yaml ./src/docs/openapi.yaml
COPY public/ ./public/

RUN chown -R app:app /app

USER app

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
