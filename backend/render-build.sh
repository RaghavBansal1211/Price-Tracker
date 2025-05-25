#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
npm install

# Ensure the Puppeteer cache directory exists
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Set environment variable to use Puppeteer's custom Chromium path
export PUPPETEER_CACHE_DIR
export PUPPETEER_EXECUTABLE_PATH=$(npx puppeteer browsers install chrome | grep -o '/.*/chrome' | head -1)

# Download the Chrome binary if not already present
npx puppeteer browsers install chrome

# Copy Puppeteer cache to/from build cache
if [[ -d /opt/render/project/src/.cache/puppeteer/chrome ]]; then
  echo "...Restoring Puppeteer Cache from Build Cache"
  cp -R /opt/render/project/src/.cache/puppeteer/chrome/* $PUPPETEER_CACHE_DIR/
else
  echo "...Storing Puppeteer Cache in Build Cache"
  mkdir -p /opt/render/project/src/.cache/puppeteer/chrome/
  cp -R $PUPPETEER_CACHE_DIR/* /opt/render/project/src/.cache/puppeteer/chrome/
fi
