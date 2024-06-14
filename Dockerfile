FROM node:20-alpine as builder
WORKDIR /builder
COPY package-lock.json ./
COPY package.json ./
COPY tsconfig.json ./
RUN apk add --no-cache python3 build-base
RUN npm ci
COPY ./src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine as prod
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
