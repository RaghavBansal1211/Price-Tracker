const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const { cloudinary } = require('../services/cloudinary');
const UserAgent = require('user-agents');
puppeteer.use(StealthPlugin());


// Open a fresh browser for each request
const launchBrowser = async () => {
  console.log('🚀 Launching new browser...');
  return await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 180_000, 
  });
};

const preparePage = async (browser) => {
  const page = await browser.newPage();
  const userAgent = new UserAgent({ deviceCategory: 'desktop' });
  await page.setUserAgent(userAgent.toString());
  await page.setExtraHTTPHeaders({
  'accept-language': 'en-US,en;q=0.9',
  'referer': 'https://www.google.com/',
  });

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

  // Handle cookie banners
  page.once('domcontentloaded', async () => {
    try {
      await page.waitForSelector('#sp-cc-accept', { timeout: 5000 });
      await page.click('#sp-cc-accept');
      console.log('🍪 Accepted cookie consent');
    } catch (err) {
      // No banner
    }
  });

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
      console.warn('⚠️ Availability check skipped:', err.message);
    } else {
      throw err;
    }
  }
};



const scrapeFullProduct = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const browser = await launchBrowser();
  const page = await preparePage(browser);

  try {
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForSelector('#productTitle', { timeout: 15000 });
    await checkAvailability(page);

    const title = await page.$eval('#productTitle', (el) => el.innerText.trim());
    const priceWhole = await page.$eval('.a-price-whole', (el) => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', (el) => el.innerText).catch(() => '00');

    if (!priceWhole) throw new Error('Price not found');
    const price = parseFloat(`${priceWhole.replace(/\D/g, '')}.${priceFraction.replace(/\D/g, '')}`);
    if (isNaN(price)) throw new Error('Failed to parse price');

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
        console.warn('⚠️ Image upload failed:', err.message);
      }
    }

    return { title, price, image };
  } catch (err) {
    console.error('❌ scrapeFullProduct failed:', err.message);
    throw err;
  } finally {
    await page.close();
    await browser.close();
  }
};

const scrapePriceOnly = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const browser = await launchBrowser();
  const page = await preparePage(browser);

  try {
    console.log(`🔍 Checking price at: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((res) => setTimeout(res, 3000));
    await checkAvailability(page);

    const priceWhole = await page.$eval('.a-price-whole', (el) => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', (el) => el.innerText).catch(() => '00');

    if (!priceWhole) throw new Error('Price not found');
    const price = parseFloat(`${priceWhole.replace(/\D/g, '')}.${priceFraction.replace(/\D/g, '')}`);
    if (isNaN(price)) throw new Error('Failed to parse price');

    return { price };
  } catch (err) {
    console.error('❌ scrapePriceOnly failed:', err.message);
    throw err;
  } finally {
    await page.close();
    await browser.close();
  }
};

module.exports = {
  scrapeFullProduct,
  scrapePriceOnly,
};
