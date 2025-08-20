FROM node:22-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl \
 && rm -rf /var/lib/apt/lists/*

# install/build npm deps
FROM base AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++  \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig.json build.mts eslint.config.mjs ./
RUN npm ci

# build stage
FROM deps AS builder
WORKDIR /app

COPY src ./src
COPY prisma ./prisma

RUN npm run db:generate \
 && npm run build

# production
FROM base AS prod
WORKDIR /app

ENV NODE_ENV=production \
    DATABASE_URL="file:/app/library.db" \
    LIBRARY_PATH="/app/library"

RUN mkdir -p library

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma

RUN npm prune --omit=dev

ENTRYPOINT ["sh", "-c", "npx prisma migrate deploy && node ./build/deploy-commands.mjs && node ./build/beatnik.mjs"]

# dev server
FROM base AS dev
WORKDIR /app

COPY package*.json tsconfig.json build.mts eslint.config.mjs ./
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma

CMD ["tsx", "watch", "src/beatnik.ts"]
