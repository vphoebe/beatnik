FROM node:20-alpine as builder
WORKDIR /builder
COPY package-lock.json ./
COPY package.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
RUN apk add --no-cache python3 py3-pip python3-dev build-base
RUN npm ci
COPY ./src ./src
RUN npm run build
RUN npx prisma generate
RUN npm prune --omit=dev

FROM node:20-alpine as prod
ENV TOKEN="" \
  CLIENT_ID="" \ 
  DATABASE_URL="file:/usr/beatnik/library.db" \
  LIBRARY_PATH="/usr/beatnik/library" \
  YT_COOKIE_JSON="/usr/beatnik/cookies.json" \
  YTDL_NO_UPDATE=1 \
  NODE_ENV="production"
WORKDIR /usr/beatnik
RUN mkdir library
RUN echo "[]" > cookies.json
RUN touch library.db
RUN apk add --no-cache ffmpeg
COPY package.json ./
COPY --from=builder /builder/prisma ./prisma
COPY --from=builder /builder/node_modules ./node_modules
COPY --from=builder /builder/build ./build
CMD npx prisma migrate deploy ; node ./build/deploy-global-commands.cjs ; node ./build/beatnik.cjs
