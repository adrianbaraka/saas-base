# Stage 1: Dependencies
FROM oven/bun:1.3.14-alpine AS dependencies
WORKDIR /build
COPY package.json bun.lock ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --no-save --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1.3.14-alpine AS builder
WORKDIR /build
COPY --from=dependencies /build/node_modules ./node_modules
COPY . .


ENV NODE_ENV=production
RUN bun run build && mv build/index.js build/base-frontend.js


# Stage 3: Runtime
FROM oven/bun:1.3.14-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder --chown=bun:bun /build/build ./build
COPY --from=builder --chown=bun:bun /build/healthCheck.ts healthCheck.ts

USER bun
EXPOSE 3000
CMD ["bun", "build/base-frontend.js"]
