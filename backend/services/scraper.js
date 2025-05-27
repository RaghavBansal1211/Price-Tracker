const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const axios = require('axios');
const { cloudinary } = require('../services/cloudinary');

puppeteerExtra.use(pluginStealth());

let browser;

const getBrowser = async () => {
  if (!browser) {
    browser = await puppeteerExtra.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
};

const preparePage = async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  const userAgent = new UserAgent();
  await page.setUserAgent(userAgent.toString());

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setViewport({ width: 1280, height: 800 });
  return page;
};

const saveScreenshotToCloudinary = async (page, label = 'error') => {
  try {
    const screenshotBuffer = await page.screenshot({ fullPage: true });

    // Convert buffer to base64 string
    const base64String = screenshotBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64String}`;

    // Upload to cloudinary folder 'debug-screenshots'
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'debug-screenshots',
      public_id: `${label}-${Date.now()}`,
      overwrite: true,
    });

    console.log(`Screenshot uploaded to Cloudinary: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;
  } catch (err) {
    console.error('Failed to upload screenshot to Cloudinary:', err);
  }
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
    await saveScreenshotToCloudinary(page, 'scrapeFullProduct');
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
    await saveScreenshotToCloudinary(page, 'scrapePriceOnly');
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
