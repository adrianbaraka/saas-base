# Dependencies
FROM oven/bun:1.4.4-alpine AS dependencies
WORKDIR /build
COPY package.json bun.lock ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --no-save --frozen-lockfile


# Build
FROM oven/bun:1.4.4-alpine AS builder
WORKDIR /build
COPY --from=dependencies /build/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN bun build \
	--minify \
	--compile \
	--target bun-linux-x64-musl \
	--outfile app_binary_name-backend \
	src/index.ts

# Runtime
FROM alpine:3.24.3 AS runtime

RUN apk add --no-cache libgcc libstdc++ ca-certificates \
    && addgroup -S app && adduser -S app -G app \
    && mkdir -p /data/certificates /data/teacher-documents \
    && chown -R app:app /data

WORKDIR /app

COPY --chown=app:app ./drizzle drizzle
COPY --from=builder --chown=app:app /build/app_binary_name-backend app_binary_name-backend

ENV NODE_ENV=production
# drizzle migrations
ENV MIGRATIONS_FOLDER=./drizzle

EXPOSE 8000

USER app

CMD ["./app_binary_name-backend"]
