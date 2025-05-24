const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let browser;

const getBrowser = async () => {
  if (!browser) {
    try {
      console.log('Launching Puppeteer...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });
      console.log('Browser launched successfully.');
    } catch (err) {
      console.error('Failed to launch Puppeteer:', err);
      throw new Error('Failed to launch Puppeteer');
    }
  }
  return browser;
};

const checkAvailability = async (page) => {
  try {
    const text = await page.$eval('#availability', el => el.innerText);
    if (text && text.toLowerCase().includes('currently unavailable')) {
      throw new Error('Product is currently unavailable');
    }
  } catch (err) {
    if (!err.message.includes('unavailable')) {
      console.warn('Availability block missing or error:', err.message);
    } else {
      throw err;
    }
  }
};

const scrapeFullProduct = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const browser = await getBrowser();
  let page;

  try {
    page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForSelector('#productTitle', { timeout: 10000 });
    await checkAvailability(page);

    const title = await page.$eval('#productTitle', el => el.innerText.trim());

    const priceWhole = await page.$eval('.a-price-whole', el => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', el => el.innerText).catch(() => '00');

    if (!priceWhole) throw new Error('Price not found');

    const numericPrice = parseFloat(
      `${priceWhole.replace(/[\D]/g, '')}.${priceFraction.replace(/[\D]/g, '')}`
    );
    if (isNaN(numericPrice)) throw new Error('Failed to parse price');

    const imageUrl = await page.$eval('#landingImage', el => el.src).catch(() => null);

    let localImagePath = null;
    if (imageUrl) {
      try {
        const imageExt = path.extname(new URL(imageUrl).pathname).split('?')[0] || '.jpg';
        const imageName = `${Date.now()}${imageExt}`;
        const imagePath = path.join(__dirname, '../uploads', imageName);

        const response = await axios({ url: imageUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        localImagePath = `uploads/${imageName}`;
      } catch (err) {
        console.warn('Image download failed:', err.message);
      }
    }

    return { title, price: numericPrice, image: localImagePath };
  } catch (err) {
    console.error('Scraping failed:', err.message);
    throw new Error('Scraping failed: ' + err.message);
  } finally {
    if (page && !page.isClosed()) await page.close();
  }
};

const scrapePriceOnly = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const browser = await getBrowser();
  let page;

  try {
    page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await checkAvailability(page);

    const priceWhole = await page.$eval('.a-price-whole', el => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', el => el.innerText).catch(() => '00');

    if (!priceWhole) throw new Error('Price not found');

    const numericPrice = parseFloat(
      `${priceWhole.replace(/[\D]/g, '')}.${priceFraction.replace(/[\D]/g, '')}`
    );
    if (isNaN(numericPrice)) throw new Error('Failed to parse price');

    return { price: numericPrice };
  } catch (err) {
    console.error('Price scraping failed:', err.message);
    throw new Error('Price scraping failed: ' + err.message);
  } finally {
    if (page && !page.isClosed()) await page.close();
  }
};

process.on('exit', async () => {
  if (browser) await browser.close();
});

module.exports = {
  scrapeFullProduct,
  scrapePriceOnly,
};
