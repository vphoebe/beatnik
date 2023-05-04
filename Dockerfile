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
ENV PM2_PUBLIC_KEY="" \
  PM2_SECRET_KEY="" \
  TOKEN="" \
  CLIENT_ID="" \ 
  DATABASE_PATH="/usr/beatnik/beatnik.sqlite" \
  CACHE_PATH="/usr/beatnik/cache" \
  MAX_CACHE_SIZE_IN_MB="128" \
  NODE_ENV="production"
WORKDIR /usr/beatnik
RUN mkdir cache
COPY --from=builder /builder/node_modules ./node_modules
COPY --from=builder /builder/build ./build
COPY ecosystem.config.cjs ./
COPY package.json ./
RUN touch beatnik.sqlite
RUN apk add --no-cache ffmpeg
RUN npm install --location=global pm2
CMD ["pm2-runtime", "ecosystem.config.cjs"]
