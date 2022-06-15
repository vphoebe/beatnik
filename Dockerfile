FROM node:16-alpine as builder
WORKDIR /usr/beatnik-build
ENV NODE_ENV="development"
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
RUN apk add --no-cache python3 build-base
RUN npm install -g node-gyp
RUN npm install
COPY ./src ./src
RUN npm run build
RUN npm prune --production

FROM node:16-alpine as prod
ENV PM2_PUBLIC_KEY="" \
  PM2_SECRET_KEY="" \
  TOKEN="" \
  CLIENT_ID="" \ 
  DATABASE_PATH="" \
  NODE_ENV="production"
WORKDIR /usr/beatnik
COPY --from=builder /usr/beatnik-build/node_modules ./node_modules
COPY --from=builder /usr/beatnik-build/build ./build
COPY ecosystem.config.js ./
RUN apk add --no-cache ffmpeg
RUN npm install pm2 -g
CMD ["pm2-runtime", "ecosystem.config.js"]
