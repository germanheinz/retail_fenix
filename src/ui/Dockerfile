# Build Stage
FROM node:20-alpine AS build-env

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Package Stage
FROM node:20-alpine

RUN apk add --no-cache curl

ENV APPUSER=appuser
ENV APPUID=1001
ENV APPGID=1001

RUN addgroup -g "$APPGID" "$APPUSER" && \
    adduser -D -h /app -u "$APPUID" -G "$APPUSER" "$APPUSER"

ENV NODE_ENV=production

WORKDIR /app
USER appuser

COPY --chown=appuser:appuser --from=build-env /app/public ./public
COPY --chown=appuser:appuser --from=build-env /app/.next/standalone ./
COPY --chown=appuser:appuser --from=build-env /app/.next/static ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
