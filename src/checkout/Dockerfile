# Build Stage
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS build-env

RUN dnf --setopt=install_weak_deps=False install -q -y \
    nodejs \
    npm \
    && dnf clean all && \
    npm install -g yarn

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

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

COPY --chown=appuser:appuser --from=build-env /app/dist ./dist
COPY --chown=appuser:appuser --from=build-env /app/node_modules ./node_modules

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/main.js"]
