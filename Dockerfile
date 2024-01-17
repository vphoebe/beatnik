FROM node:18-alpine as builder
WORKDIR /builder
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.json ./
RUN npm install --location=global pnpm
RUN apk add --no-cache python3 build-base
RUN pnpm install --frozen-lockfile true
COPY ./src ./src
RUN pnpm build
RUN pnpm prune --prod

FROM node:18-alpine as prod
ENV TOKEN="" \
  CLIENT_ID="" \ 
  DATABASE_PATH="/usr/beatnik/beatnik.sqlite" \
  CACHE_PATH="/usr/beatnik/cache" \
  MAX_CACHE_SIZE_IN_MB="128" \
  YTDL_NO_UPDATE=1 \
  NODE_ENV="production"
WORKDIR /usr/beatnik
RUN mkdir cache
RUN touch beatnik.sqlite
RUN apk add --no-cache ffmpeg
COPY package.json ./
COPY --from=builder /builder/node_modules ./node_modules
COPY --from=builder /builder/build ./build
CMD node ./build/deploy-global-commands.cjs ; node ./build/beatnik.cjs
