FROM node:22-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl \
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
 && npm prune --omit=dev

# production
FROM base AS prod
WORKDIR /app

ENV NODE_ENV=production \
    DATABASE_URL="file:/app/library.db" \
    LIBRARY_PATH="/app/library"

RUN mkdir -p library

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma

ENTRYPOINT ["sh", "-c", "npx prisma migrate deploy && node ./build/deploy-commands.mjs && node ./build/beatnik.mjs"]

# dev server
FROM base AS dev
WORKDIR /app

COPY eslint.config.mjs tsconfig.json tsdown.config.ts ./
COPY --from=deps /app/node_modules ./node_modules
# src and prisma dirs must be bind mounted
CMD ["npx", "tsx", "watch", "src/beatnik.ts"]
