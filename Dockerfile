FROM node:22-trixie AS beatnik
# set up default env
ENV DATABASE_URL="file:/library.db" \
  LIBRARY_PATH="/library"
# create mount points
WORKDIR /
RUN touch library.db
RUN mkdir library
# add deps
RUN apt-get update
RUN apt-get install -y --no-install-recommends ffmpeg
# copy needed files
WORKDIR /usr/local/beatnik
# npm deps
COPY package*.json .
RUN npm install
# prisma
COPY ./prisma ./prisma
RUN npm run db:generate
# rest
COPY tsconfig.json .
COPY ./src ./src
# start beatnik
CMD ["sh", "-c", "npm run dev"]