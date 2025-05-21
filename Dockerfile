FROM node:22-alpine AS builder
WORKDIR /builder
# copy needed files
COPY package-lock.json ./
COPY package.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY ./src ./src
# add deps
RUN apk add --no-cache python3 py3-pip python3-dev build-base
RUN npm ci
# build
RUN npm run build
RUN npm run db:generate
# remove dev deps from node_modules
RUN npm prune --omit=dev

FROM node:22-alpine AS beatnik
# set up default env
ENV DATABASE_URL="file:/library.db" \
  LIBRARY_PATH="/library" \
  NODE_ENV="production"
WORKDIR /
# create mount points
RUN touch library.db
RUN mkdir library
# install ffmpeg
RUN apk add --no-cache ffmpeg
# copy runtime code
COPY package.json ./
COPY --from=builder /builder/prisma ./prisma
COPY --from=builder /builder/node_modules ./node_modules
COPY --from=builder /builder/build ./build
# start beatnik
CMD ["sh", "-c", "npm start"]
