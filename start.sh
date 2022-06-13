#!/bin/sh

node ./build/deploy-global-commands.js
pm2-runtime ecosystem.config.js
