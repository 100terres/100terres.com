FROM debian:13-slim AS builder

RUN apt-get update \
    && apt-get -y --no-install-recommends install sudo curl git ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_VERSION="v2026.10.0"
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"
RUN curl https://mise.run | sh

WORKDIR /app

COPY . .

RUN mise trust && mise install
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM ghcr.io/static-web-server/static-web-server:2-alpine

USER root
RUN apk add --no-cache curl

USER $SERVER_USER_NAME:$SERVER_GROUP_NAME
COPY --from=builder /app/dist /var/public

EXPOSE 80
