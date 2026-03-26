#
# base image with deps/files needed for each
#
FROM node:22-slim AS base
WORKDIR /app
ENV DATABASE_URL="file:/app/library.db" \
    LIBRARY_PATH="/app/library"
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./

#
# install/build/optimize npm deps and prisma client
#
FROM base AS dep-builder
WORKDIR /app
# required for node-pre-gyp to build @discordjs/opus
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++
COPY prisma ./prisma
RUN npm ci
RUN npm run db:generate
RUN npm prune --omit=dev \
 && find node_modules -type f \( \
      -name "*.md" -o -name "*.map" -o -name "*.ts" \
      -o -name "CHANGELOG*" -o -name "README*" \
      -o -name "LICENSE*" -o -name "*.test.js" \
    \) -delete \
 && find node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" \) \
      -exec rm -rf {} + 2>/dev/null; true \
 && rm -rf node_modules/@napi-rs/canvas-linux-x64-musl \
 && rm -rf node_modules/@snazzah/davey-linux-x64-musl \
 && rm -rf node_modules/@discordjs/opus/build-tmp-napi-v3

#
# production
#
FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN mkdir -p library
# copy code and prebuilt deps
COPY --from=dep-builder /app/node_modules ./node_modules
COPY --from=dep-builder /app/prisma ./prisma
COPY src ./src

ENTRYPOINT ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx ./src/beatnik.ts"]

#
# dev server
# (bind mounts required for src and prisma directories)
#
FROM base AS dev-server
WORKDIR /app
COPY eslint.config.mjs ./
COPY --from=dep-builder /app/node_modules ./node_modules
CMD ["./node_modules/.bin/tsx", "watch", "src/beatnik.ts"]
