FROM node:22-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl ffmpeg \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# install/build npm deps
FROM base AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++  \
 && rm -rf /var/lib/apt/lists/*

RUN npm ci

# build stage
FROM deps AS builder
WORKDIR /app

COPY eslint.config.mjs tsconfig.json tsdown.config.ts ./
COPY src ./src
COPY prisma ./prisma

RUN npm run db:generate \
 && npm run build \
 && npm prune --omit=dev \
 # Drop unneeded stuff in node_modules
 && find node_modules -type f \( \
      -name "*.md" -o -name "*.map" -o -name "*.ts" \
      -o -name "CHANGELOG*" -o -name "README*" \
      -o -name "LICENSE*" -o -name "*.test.js" \
    \) -delete \
 && find node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" \) \
      -exec rm -rf {} + 2>/dev/null; true \
 # Drop musl variants (using glibc/gnu on node:22-slim)
 && rm -rf node_modules/@napi-rs/canvas-linux-x64-musl \
 && rm -rf node_modules/@snazzah/davey-linux-x64-musl \
 # Drop opus build artifacts, keep only prebuild
 && rm -rf node_modules/@discordjs/opus/build-tmp-napi-v3 \
 # Drop non-debian Prisma engines
 && find node_modules/@prisma/engines -type f \
      ! -name "*debian-openssl-3.0.x*" \
      \( -name "*.node" -o -name "*.so*" \) \
      -delete

# production
FROM base AS prod
WORKDIR /app

ENV NODE_ENV=production \
    DATABASE_URL="file:/app/library.db" \
    LIBRARY_PATH="/app/library"

RUN mkdir -p library

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma

ENTRYPOINT ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node ./build/deploy-commands.mjs && node ./build/beatnik.mjs"]

# dev server
FROM base AS dev
WORKDIR /app

COPY eslint.config.mjs tsconfig.json tsdown.config.ts ./
COPY --from=deps /app/node_modules ./node_modules
# src and prisma dirs must be bind mounted
CMD ["npx", "tsx", "watch", "src/beatnik.ts"]
