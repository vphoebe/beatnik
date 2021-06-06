FROM node:14-alpine as build
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM keymetrics/pm2:14-alpine
ENV PM2_PUBLIC_KEY="" \
  PM2_SECRET_KEY="" \
  NODE_ENV="production"
WORKDIR /usr/app
COPY package*.json ./
RUN npm install --production
COPY --from=build /usr/app/build ./build
COPY --from=build /usr/app/ecosystem.config.js ./
RUN apk add --no-cache ffmpeg
CMD ["pm2-runtime", "ecosystem.config.js"]