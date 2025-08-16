FROM node:22-trixie-slim AS beatnik
# set up default env
ENV DATABASE_URL="file:/library.db" \
  LIBRARY_PATH="/library"
# create mount points
WORKDIR /
RUN touch library.db
RUN mkdir library
# copy needed files
WORKDIR /usr/local/beatnik
COPY package*.json .
# add deps
RUN apt-get update
RUN apt-get install -y --no-install-recommends python3-pip make g++ ffmpeg
RUN npm install
COPY ./src ./src
COPY ./prisma ./prisma
COPY build.mjs .
COPY tsconfig.json .
# build
RUN npm run db:generate
RUN npm run build
# start beatnik
CMD ["sh", "-c", "npm run dev"]