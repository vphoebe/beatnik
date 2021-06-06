FROM keymetrics/pm2:14-alpine

ENV PREFIX="-" \
  DISCORD_TOKEN="" \
  YOUTUBE_TOKEN="" \
  DEFAULT_VOLUME="0.3" \
  PM2_PUBLIC_KEY="" \
  PM2_SECRET_KEY="" \
  NODE_ENV="production"

RUN apk add --no-cache ffmpeg

WORKDIR /usr/beatnik
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["pm2-runtime", "ecosystem.config.js"]
