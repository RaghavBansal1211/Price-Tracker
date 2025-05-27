const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../services/cloudinary');

puppeteer.use(StealthPlugin());

let browser;

const userAgents =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const getBrowser = async () => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
};

const preparePage = async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(userAgents);

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    const blockTypes = ['image', 'stylesheet', 'font', 'media'];
    if (blockTypes.includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setViewport({ width: 1280, height: 800 });
  return page;
};

const checkAvailability = async (page) => {
  try {
    const text = await page.$eval('#availability', (el) => el.innerText);
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

// Save screenshot to /tmp and upload to Cloudinary
const saveScreenshot = async (page, label = 'error') => {
  const fileName = `${label}-${Date.now()}.png`;
  const filePath = path.join('/tmp', fileName);

  await page.screenshot({ path: filePath, fullPage: true });

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'amazon-debug',
    });
    console.log(`🧪 Screenshot uploaded: ${result.secure_url}`);
  } catch (err) {
    console.error('❌ Screenshot upload failed:', err.message);
  }
};

const scrapeFullProduct = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');
  const page = await preparePage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForSelector('#productTitle', { timeout: 15000 });

    await checkAvailability(page);

    const title = await page.$eval('#productTitle', (el) => el.innerText.trim());

    const priceWhole = await page.$eval('.a-price-whole', (el) => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', (el) => el.innerText).catch(() => '00');
    if (!priceWhole) throw new Error('Price not found');

    const numericPrice = parseFloat(
      `${priceWhole.replace(/\D/g, '')}.${priceFraction.replace(/\D/g, '')}`
    );
    if (isNaN(numericPrice)) throw new Error('Failed to parse price');

    const imageUrl = await page.$eval('#landingImage', (el) => el.src).catch(() => null);
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
  } catch (err) {
    await saveScreenshot(page, 'scrapeFullProduct');
    throw err;
  } finally {
    await page.close();
  }
};

const scrapePriceOnly = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');
  const page = await preparePage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });

    await checkAvailability(page);

    const priceWhole = await page.$eval('.a-price-whole', (el) => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', (el) => el.innerText).catch(() => '00');
    if (!priceWhole) throw new Error('Price not found');

    const numericPrice = parseFloat(
      `${priceWhole.replace(/\D/g, '')}.${priceFraction.replace(/\D/g, '')}`
    );
    if (isNaN(numericPrice)) throw new Error('Failed to parse price');

    return { price: numericPrice };
  } catch (err) {
    await saveScreenshot(page, 'scrapePriceOnly');
    throw err;
  } finally {
    await page.close();
  }
};

process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

module.exports = {
  scrapeFullProduct,
  scrapePriceOnly,
};
