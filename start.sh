#!/bin/sh

./node_modules/.bin/prisma migrate deploy
pm2-runtime ecosystem.config.js
