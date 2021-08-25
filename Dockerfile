FROM node:14-alpine as build
WORKDIR /usr/app
COPY . .
RUN npm install
RUN npx prisma generate
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
RUN apk add --no-cache ffmpeg
CMD ["pm2-runtime", "ecosystem.config.js"]
