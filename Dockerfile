FROM keymetrics/pm2:14-alpine

ENV PREFIX="-" \
  DISCORD_TOKEN="" \
  YOUTUBE_TOKEN="" \
  DEFAULT_VOLUME="0.3"

RUN apk add --no-cache ffmpeg

WORKDIR /usr/beatnik
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["pm2-runtime", "ecosystem.config.js"]
