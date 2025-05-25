# Use official Puppeteer image with all dependencies
FROM ghcr.io/puppeteer/puppeteer:24.9.0

# Optional: Define environment variables
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm ci

# Download Chrome binary into .cache during build
RUN npx puppeteer browsers install chrome

# Copy the rest of the app
COPY . .

# Start your app (adjust if needed)
CMD ["node", "index.js"]
