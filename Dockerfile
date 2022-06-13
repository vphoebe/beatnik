FROM node:16
ENV PM2_PUBLIC_KEY="" \
  PM2_SECRET_KEY="" \
  TOKEN="" \
  CLIENT_ID="" \ 
  DATABASE_PATH=""
WORKDIR /usr/app
COPY . .
RUN apt-get update && apt-get install -y ffmpeg
RUN npm install pm2 -g
RUN npm install
RUN npm rebuild
RUN npm run build
CMD ["pm2-runtime", "ecosystem.config.js"]
