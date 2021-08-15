FROM node:14-alpine as build
ENV DATABASE_URL="file:/usr/db/beatnik.db"
WORKDIR /usr/app
COPY . .
RUN npm install
RUN npx prisma migrate deploy
RUN npm run build

FROM keymetrics/pm2:14-alpine
ENV PM2_PUBLIC_KEY="" \
  PM2_SECRET_KEY="" \
  NODE_ENV="production" \
  DATABASE_URL="file:/usr/db/beatnik.db"
WORKDIR /usr/app
COPY package*.json ./
RUN npm ci
COPY --from=build /usr/app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=build /usr/app/build ./build
COPY --from=build /usr/app/ecosystem.config.js ./
COPY --from=build /usr/db /usr/db
RUN apk add --no-cache ffmpeg
CMD ["pm2-runtime", "ecosystem.config.js"]
