const Agenda = require('agenda');
const mongoose = require('mongoose');
const Product = require('../model/product');
const {scrapePriceOnly} = require('./scraper');

const mongoConnectionString = 'mongodb://127.0.0.1:27017/PriceTracker';

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
});

// Define the scraping job
agenda.define('scrape product price', async (job) => {
  const { productId } = job.attrs.data;

  const product = await Product.findById(productId);
  if (!product) {
    console.error(`Product ${productId} not found`);
    return;
  }

  console.log(product);

  const url = `https://www.amazon.${product.domain}/dp/${product.asin}`;
  console.log(`Scraping price for product ${productId} at ${url}`);

  try {
    const { price } = await scrapePriceOnly(url);

    // Always push price to history
    product.priceHistory.push({ price });

    // Also update current price for reference
    product.currentPrice = price;

    await product.save();

    console.log(`Stored price for product ${productId}: ${price}`);
  } catch (error) {
    console.error(`Failed to scrape product ${productId}:`, error.message);
  }
});

// Start agenda and schedule jobs for all products on startup
async function initAgenda() {
  await agenda.start();
  const products = await Product.find();
  products.forEach(product => {
    agenda.every('30 minutes', 'scrape product price', { productId: product._id });
  });
}

module.exports = { agenda, initAgenda };

