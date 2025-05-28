const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const { cloudinary } = require('../services/cloudinary');

puppeteer.use(StealthPlugin());

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

// Open a fresh browser for each request
const launchBrowser = async () => {
  console.log('🚀 Launching new browser...');
  return await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 180_000, // 3 mins
  });
};

const preparePage = async (browser) => {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

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

const saveScreenshot = async (page, label = 'error') => {
  try {
    const buffer = await page.screenshot({ type: 'png', fullPage: true, timeout: 15000 });
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/png;base64,${buffer.toString('base64')}`,
      { folder: 'amazon-debug', public_id: `${label}-${Date.now()}` }
    );
    console.log(`📷 Screenshot uploaded: ${uploadResult.secure_url}`);
  } catch (err) {
    console.error('❌ Screenshot upload failed:', err.message);
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
    await saveScreenshot(page, 'scrapeFullProduct');
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await checkAvailability(page);

    const priceWhole = await page.$eval('.a-price-whole', (el) => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', (el) => el.innerText).catch(() => '00');

    if (!priceWhole) throw new Error('Price not found');
    const price = parseFloat(`${priceWhole.replace(/\D/g, '')}.${priceFraction.replace(/\D/g, '')}`);
    if (isNaN(price)) throw new Error('Failed to parse price');

    return { price };
  } catch (err) {
    console.error('❌ scrapePriceOnly failed:', err.message);
    await saveScreenshot(page, 'scrapePriceOnly');
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
