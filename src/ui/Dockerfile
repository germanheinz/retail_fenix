# Build Stage
FROM node:20-alpine AS build-env

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Package Stage
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf --setopt=install_weak_deps=False install -q -y \
    nodejs \
    shadow-utils \
    && dnf clean all

ENV APPUSER=appuser
ENV APPUID=1000
ENV APPGID=1000

RUN useradd \
    --home "/app" \
    --create-home \
    --user-group \
    --uid "$APPUID" \
    "$APPUSER"

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
