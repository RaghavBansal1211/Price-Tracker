FROM ghcr.io/puppeteer/puppeteer:24.9.0

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y chromium
RUN npm ci

COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node", "index.js"]
