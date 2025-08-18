FROM node:22-slim AS beatnik
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig.json build.mts ./ 
COPY src ./src
COPY prisma ./prisma

RUN npm ci \
 && npm run db:generate

CMD ["npm", "run", "dev"]