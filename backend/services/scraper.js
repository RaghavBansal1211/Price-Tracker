const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const { cloudinary } = require('../services/cloudinary');

puppeteer.use(StealthPlugin());

let browser;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Rotate user agents
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  'Mozilla/5.0 (X11; Linux x86_64)...',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X)...',
  'Mozilla/5.0 (Linux; Android 10; SM-G970F)...'
];

const getBrowser = async () => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--single-process',
        '--disable-dev-shm-usage',
      ],
    });
  }
  return browser;
};

const preparePage = async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Randomize user agent
  await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

  // Block unnecessary resources
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    const blockTypes = ['image', 'stylesheet', 'font', 'media', 'script'];
    if (blockTypes.includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Optional viewport to simulate real user
  await page.setViewport({ width: 1280, height: 800 });

  return page;
};

const scrollPage = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
};

const checkAvailability = async (page) => {
  try {
    const text = await page.$eval('#availability', el => el.innerText);
    if (text.toLowerCase().includes('currently unavailable')) {
      throw new Error('Product is currently unavailable');
    }
  } catch (err) {
    if (!err.message.includes('unavailable')) {
      console.warn('Availability check skipped:', err.message);
    } else {
      throw err;
    }
  }
};

const scrapeFullProduct = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const page = await preparePage();
  try {
    await delay(1000 + Math.random() * 2000);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await scrollPage(page);
    await delay(1000 + Math.random() * 2000);

    await page.waitForSelector('#productTitle', { timeout: 15000 });
    await checkAvailability(page);

    const title = await page.$eval('#productTitle', el => el.innerText.trim());

    const priceWhole = await page.$eval('.a-price-whole', el => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', el => el.innerText).catch(() => '00');
    if (!priceWhole) throw new Error('Price not found');

    const numericPrice = parseFloat(
      `${priceWhole.replace(/\D/g, '')}.${priceFraction.replace(/\D/g, '')}`
    );
    if (isNaN(numericPrice)) throw new Error('Failed to parse price');

    const imageUrl = await page.$eval('#landingImage', el => el.src).catch(() => null);
    let image = null;

    if (imageUrl) {
      try {
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(res.data, 'binary').toString('base64');
        const uploadResult = await cloudinary.uploader.upload(
          `data:${res.headers['content-type'] || 'image/jpeg'};base64,${base64}`,
          { folder: 'amazon-products' }
        );
        image = uploadResult.secure_url;
      } catch (err) {
        console.warn('Image upload failed:', err.message);
      }
    }

    return { title, price: numericPrice, image };
  } finally {
    await page.close();
  }
};

const scrapePriceOnly = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const page = await preparePage();
  try {
    await delay(1000 + Math.random() * 2000);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await scrollPage(page);
    await delay(1000 + Math.random() * 2000);

    await checkAvailability(page);

    const priceWhole = await page.$eval('.a-price-whole', el => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', el => el.innerText).catch(() => '00');
    if (!priceWhole) throw new Error('Price not found');

    const numericPrice = parseFloat(
      `${priceWhole.replace(/\D/g, '')}.${priceFraction.replace(/\D/g, '')}`
    );
    if (isNaN(numericPrice)) throw new Error('Failed to parse price');

    return { price: numericPrice };
  } finally {
    await page.close();
  }
};

// Gracefully close browser
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

module.exports = {
  scrapeFullProduct,
  scrapePriceOnly,
};
