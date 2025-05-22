FROM node:22-alpine AS builder
WORKDIR /builder
# copy needed files
COPY package-lock.json ./
COPY package.json ./
COPY tsconfig.json ./
COPY build.mjs ./
COPY prisma ./prisma
COPY ./src ./src
# add deps
RUN apk add --no-cache python3 py3-pip python3-dev build-base
RUN npm ci
# build
RUN npm run db:generate
RUN npm run build

FROM node:22-alpine AS beatnik
# set up default env
ENV DATABASE_URL="file:/library.db" \
  LIBRARY_PATH="/library" \
  NODE_ENV="production"
# create mount points
WORKDIR /
RUN touch library.db
RUN mkdir library
# install ffmpeg
RUN apk add --no-cache ffmpeg
# copy runtime code
WORKDIR /usr/local/beatnik
COPY package.json ./
COPY --from=builder /builder/prisma/migrations ./prisma/migrations
COPY --from=builder /builder/prisma/schema.prisma ./prisma
COPY --from=builder /builder/prisma/generated/client/*.node ./build/
COPY --from=builder /builder/build ./build
COPY --from=builder /builder/node_modules/@discordjs/opus ./node_modules/@discordjs/opus
COPY --from=builder /builder/node_modules/sodium-native ./node_modules/sodium-native

# start beatnik
CMD ["sh", "-c", "npm start"]
