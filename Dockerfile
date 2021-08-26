FROM node:14-alpine as build
WORKDIR /usr/app
COPY . .
RUN npm install
RUN npm run build
RUN npm prune --production

FROM keymetrics/pm2:14-alpine
ENV PM2_PUBLIC_KEY="" \
  PM2_SECRET_KEY="" \
  NODE_ENV="production"
WORKDIR /usr/app
COPY --from=build /usr/app/node_modules/ ./node_modules/
COPY --from=build /usr/app/build ./build
COPY --from=build /usr/app/ecosystem.config.js ./
COPY --from=build /usr/app/prisma/ ./prisma
ADD start.sh /usr/app
RUN chmod +x ./start.sh
RUN apk add --no-cache ffmpeg
CMD ["sh", "./start.sh"]
