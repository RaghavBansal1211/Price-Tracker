const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let browser;

const getBrowser = async () => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('Browser launched');
  }
  return browser;
};

const scrapeFullProduct = async (url) => {
  if (!url.includes('amazon.')) {
    throw new Error('Invalid Amazon URL');
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#productTitle', { timeout: 10000 });

    const title = await page.$eval('#productTitle', el => el.innerText.trim());
    const priceWhole = await page.$eval('.a-price-whole', el => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', el => el.innerText).catch(() => '00');

    if (!priceWhole) throw new Error('Price not found');

    const numericPrice = parseFloat(
      `${priceWhole.replace(/[^\d]/g, '')}.${priceFraction.replace(/[^\d]/g, '')}`
    );

    if (isNaN(numericPrice)) throw new Error('Failed to parse price');

    const imageUrl = await page.$eval('#landingImage', el => el.src).catch(() => null);

    let localImagePath = null;
    if (imageUrl) {
      const imageExt = path.extname(new URL(imageUrl).pathname).split('?')[0] || '.jpg';
      const imageName = `${Date.now()}${imageExt}`;
      const imagePath = path.join(__dirname, '../uploads', imageName);

      const response = await axios({
        url: imageUrl,
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      localImagePath = `uploads/${imageName}`;
    }

    return { title, price: numericPrice, image: localImagePath };
  } catch (err) {
    throw new Error('Scraping failed: ' + err.message);
  } finally {
    await page.close();
  }
};

const scrapePriceOnly = async (url) => {
  if (!url.includes('amazon.')) {
    throw new Error('Invalid Amazon URL');
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const priceWhole = await page.$eval('.a-price-whole', el => el.innerText).catch(() => null);
    const priceFraction = await page.$eval('.a-price-fraction', el => el.innerText).catch(() => '00');

    if (!priceWhole) throw new Error('Price not found');

    const numericPrice = parseFloat(
      `${priceWhole.replace(/[^\d]/g, '')}.${priceFraction.replace(/[^\d]/g, '')}`
    );

    if (isNaN(numericPrice)) throw new Error('Failed to parse price');

    return { price: numericPrice };
  } catch (err) {
    throw new Error('Price scraping failed: ' + err.message);
  } finally {
    await page.close();
  }
};

process.on('exit', async () => {
  if (browser) await browser.close();
});

module.exports = {
  scrapeFullProduct,
  scrapePriceOnly,
};
