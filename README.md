# 🕸️ Amazon Product Tracker – Backend

This is the backend for the Amazon Product Tracker app. It scrapes Amazon product data using Puppeteer with stealth and handles scheduled price tracking, image uploads to Cloudinary, and user authentication.

---

## 🚀 Setup Instructions

Follow these steps to run the backend locally or deploy it to platforms like Render.

### 1. Clone the Repository

```bash
git clone https://github.com/RaghavBansal1211/Price-Tracker.git
cd Price-Tracker-backend
```

### 2. Install Dependencies

```bash
npm install
```

---

### 🧑‍💻 Local Development (Non-deploy)

To run the backend locally **without deploying**, follow these additional steps after installing dependencies:

```bash
npx puppeteer browsers install chrome
```

This will download the necessary Chrome binary and create the `./.cache` directory required by Puppeteer.

Then start the backend:

```bash
node index.js
```

---

### ☁️ Deploying (Render/Production)

If you're deploying on Render or a similar service, use this build script(already included in the repo) to handle Puppeteer setup:

```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm install
# Uncomment this line if you need to build your project
# npm run build 

# Ensure the Puppeteer cache directory exists
PUPPETEER_CACHE_DIR=/opt/render/project/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Install Puppeteer and download Chrome
npx puppeteer browsers install chrome

# Store/pull Puppeteer cache with build cache
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then 
  echo "...Copying Puppeteer Cache from Build Cache"
  cp -R /opt/render/project/src/backend/.cache/puppeteer/chrome/ $PUPPETEER_CACHE_DIR
else 
  echo "...Storing Puppeteer Cache in Build Cache"
  cp -R $PUPPETEER_CACHE_DIR /opt/render/project/src/backend/.cache/puppeteer/chrome/
fi
```

---

## 🔐 Required Environment Variables

Create a `.env` file in the root directory and define the following variables:

```env
PORT=5000
USER_EMAIL=your_admin_email@example.com
USER_PASS=your_admin_password
MONGODB_CONNECTION_STRING=mongodb+srv://<username>:<password>@cluster.mongodb.net/dbname
FRONT_END_URL=https://your-frontend-domain.com

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

JWT_SECRET=your_super_secret_key
```

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

---

## 🧪 Scripts

- `node index.js`: Start server manually (for local dev)

---

## 📦 API Endpoints (Overview)

| Method | Route                     | Description                     |
|--------|---------------------------|---------------------------------|
| POST   | `/api/scrape/full`        | Scrapes full product details    |
| POST   | `/api/scrape/price`       | Scrapes only the product price  |
| POST   | `/api/signup`, `/login`   | Auth endpoints                  |
| GET    | `/products/fetchAll`      | Fetch all tracked products      |


# PricePulse Frontend

This is the frontend for the PricePulse project.

## 🚀 Getting Started

To start the frontend development server:

```bash
npm install
npm run dev
```

Make sure the following environment variable is set in your `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000 # or your backend URL
```

> Tailwind CSS and other required configurations are assumed to be included in the repository after cloning.

## 📦 Built With

- Vite
- React
- Tailwind CSS
