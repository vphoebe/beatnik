#
# install / build npm deps
#
FROM node:22-trixie AS deps-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

#
# build app for distroless / optimize deps
#
FROM deps-builder AS app-builder
WORKDIR /app
RUN mkdir -p library
COPY tsdown.config.ts ./
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
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
FROM gcr.io/distroless/nodejs22-debian13 AS prod
WORKDIR /app
ENV DATABASE_URL="/app/library.db" \
    LIBRARY_PATH="/app/library" \
    NODE_ENV="production"
COPY --from=app-builder /app/dist ./dist
COPY --from=app-builder /app/node_modules ./node_modules
COPY --from=app-builder /app/package.json ./
CMD ["dist/beatnik.mjs"]

#
# dev server
# (bind mount required for src directory)
#
FROM deps-builder AS dev-server
WORKDIR /app
COPY tsconfig.json ./
CMD ["./node_modules/.bin/tsx", "watch", "src/beatnik.ts"]
