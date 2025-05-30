const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const { cloudinary } = require('../services/cloudinary');
const { v4: uuidv4 } = require('uuid');


// Configure stealth plugin
puppeteer.use(StealthPlugin());

// Browser instance management
let browser = null;
let launchLock = null;
const MAX_LAUNCH_RETRIES = 3;
const HEALTH_CHECK_INTERVAL = 300_000; // 5 minutes

// Browser factory with health checks
const getBrowser = async () => {
  // Existing healthy browser
  if (await isBrowserHealthy(browser)) {
    return browser;
  }

  // Launch in progress
  if (launchLock) {
    return launchLock;
  }

  // New launch sequence
  launchLock = (async () => {
    for (let attempt = 1; attempt <= MAX_LAUNCH_RETRIES; attempt++) {
      try {
        console.log(`🚀 Launching browser (attempt ${attempt})...`);
        
        const newBrowser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
          ],
          protocolTimeout: 120_000,
        });

        newBrowser.on('disconnected', () => {
          console.warn('💥 Browser disconnected');
          clearInterval(healthCheck);
          browser = null;
        });

        // Periodic health checks
        const healthCheck = setInterval(async () => {
          if (!(await isBrowserHealthy(newBrowser))) {
            console.warn('🩺 Periodic health check failed');
            clearInterval(healthCheck);
            await newBrowser.close().catch(() => {});
          }
        }, HEALTH_CHECK_INTERVAL);

        return newBrowser;
      } catch (err) {
        console.error(`🚨 Launch failed (attempt ${attempt}):`, err.message);
        if (attempt === MAX_LAUNCH_RETRIES) throw err;
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  })();

  try {
    browser = await launchLock;
    return browser;
  } finally {
    launchLock = null;
  }
};

// Robust health checker
const isBrowserHealthy = async (browser) => {
  if (!browser) return false;
  
  try {
    // Check process status
    if (!browser.process() || browser.process().killed) return false;
    
    // Verify responsiveness
    await Promise.race([
      browser.version(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      )
    ]);
    
    return true;
  } catch (err) {
    console.warn('⚠️ Browser unhealthy:', err.message);
    await browser.close().catch(() => {});
    return false;
  }
};

// Page configuration
const createPage = async (browser) => {
  const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
    // Spoof navigator and window properties
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      get: () => 1,
    });
  });

  // Viewport
  await page.setViewport({
    width: 1280 + Math.floor(Math.random() * 100),
    height: 800 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
  });

  // User Agent
  const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();
  await page.setUserAgent(userAgent);

  // Headers
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.9',
    'upgrade-insecure-requests': '1',
    'sec-fetch-user': '?1',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'navigate',
  });

  // Block unnecessary resources
  await page.setRequestInterception(true);
  page.on('request', req => {
    const blockTypes = new Set(['image', 'stylesheet', 'font', 'media']);
    blockTypes.has(req.resourceType()) ? req.abort() : req.continue();
  });

  return page;
};


// Cleanup handlers
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received - cleaning up');
  browser && await browser.close();
});
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received - cleaning up');
  browser && await browser.close();
});



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

  const browser = await getBrowser();
  const page = await createPage(browser);

  try {
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await new Promise((res) => setTimeout(res, 3000));
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
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: 'amazon-products',
        });
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
  }
};

const scrapePriceOnly = async (url) => {
  if (!url.includes('amazon.')) throw new Error('Invalid Amazon URL');

  const browser = await getBrowser();
  const page = await createPage(browser);

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
  }
};

module.exports = {
  scrapeFullProduct,
  scrapePriceOnly,
};
