# Build Stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
COPY --chown=node:node . .

RUN for attempt in 1 2 3; do yarn install --frozen-lockfile --network-timeout 600000 && break || { [ "$attempt" -lt 3 ] && echo "Retry $attempt..." && sleep 10; }; done

RUN yarn build
USER node

# Package Stage
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf --setopt=install_weak_deps=False install -q -y \
    nodejs20 \
    shadow-utils \
    && \
    dnf clean all

RUN alternatives --install /usr/bin/node node /usr/bin/node-20 90

ENV APPUSER=appuser
ENV APPUID=1000
ENV APPGID=1000

RUN useradd \
    --home "/app" \
    --create-home \
    --user-group \
    --uid "$APPUID" \
    "$APPUSER"

WORKDIR /app
USER appuser

COPY --chown=appuser:appuser --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=appuser:appuser --from=build /usr/src/app/dist ./dist

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

ENTRYPOINT ["node", "dist/main.js"]
