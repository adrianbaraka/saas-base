# Stage 1: Dependencies
FROM oven/bun:1.4.4-alpine AS dependencies
WORKDIR /build
COPY package.json bun.lock ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --no-save --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1.4.4-alpine AS builder
WORKDIR /build
COPY --from=dependencies /build/node_modules ./node_modules
COPY . .

ARG GIT_SHA=dev
ARG PUBLIC_FRONTEND_URL
ENV NODE_ENV=production \
    GIT_SHA=$GIT_SHA \
    PUBLIC_FRONTEND_URL=$PUBLIC_FRONTEND_URL
RUN SKIP_ENV_VALIDATION=1 bun run --bun build && mv build/index.js build/app_binary_name-frontend.js


# Stage 3: Runtime
FROM oven/bun:1.4.4-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder --chown=bun:bun /build/build ./build
COPY --from=builder --chown=bun:bun /build/healthCheck.ts healthCheck.ts

USER bun
EXPOSE 3000
CMD ["bun", "build/app_binary_name-frontend.js"]
