const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const UserAgent = require('user-agents');

puppeteer.use(StealthPlugin());

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

  // Use random realistic user-agent
  const userAgent = new UserAgent();
  await page.setUserAgent(userAgent.toString());

  await page.setViewport({ width: 1280, height: 800 });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const blockTypes = ['image', 'stylesheet', 'font', 'media'];
    if (blockTypes.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // Spoof navigator.webdriver
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  // Cookie banner auto-accept
  page.once('domcontentloaded', async () => {
    try {
      await page.waitForSelector('#sp-cc-accept', { timeout: 5000 });
      await page.click('#sp-cc-accept');
      console.log('🍪 Accepted cookie consent');
    } catch {}
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

// 📦 Full product scrape
const scrapeFullProduct = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const browser = await launchBrowser();
  const page = await preparePage(browser);

  try {
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForTimeout(1000); // Small delay
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
        const contentType = res.headers['content-type'] || 'image/jpeg';
        image = `data:${contentType};base64,${base64}`;
      } catch (err) {
        console.warn('⚠️ Image fetch failed:', err.message);
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

// 💲 Price-only scrape
const scrapePriceOnly = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const browser = await launchBrowser();
  const page = await preparePage(browser);

  try {
    console.log(`🔍 Checking price at: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
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
