FROM node:16-alpine as builder
WORKDIR /builder
COPY package-lock.json ./
COPY package.json ./
COPY tsconfig.json ./
RUN apk add --no-cache python3 build-base
RUN npm ci
COPY ./src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:16-alpine as prod
ENV PM2_PUBLIC_KEY="" \
  PM2_SECRET_KEY="" \
  TOKEN="" \
  CLIENT_ID="" \ 
  DATABASE_PATH="/usr/beatnik/beatnik.sqlite" \
  CACHE_PATH="/usr/beatnik/cache" \
  MAX_CACHE_SIZE_IN_MB="128" \
  NODE_ENV="production"
WORKDIR /usr/beatnik
COPY --from=builder /builder/node_modules ./node_modules
COPY --from=builder /builder/build ./build
COPY ecosystem.config.js ./
RUN apk add --no-cache ffmpeg
RUN npm install --location=global pm2
CMD ["pm2-runtime", "ecosystem.config.js"]
