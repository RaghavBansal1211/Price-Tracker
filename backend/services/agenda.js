const Agenda = require('agenda');
const mongoose = require('mongoose');
const Product = require('../model/product');
const {scrapePriceOnly} = require('./scraper');
const sendPriceDropAlerts = require('../services/priceAlert');
const dotenv = require("dotenv");
dotenv.config();

const mongoConnectionString = process.env.MONGODB_CONNECTION_STRING;

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
  maxConcurrency: 50
});

// Define the scraping job
agenda.define('scrape product price', async (job) => {
  const { productId } = job.attrs.data;

  const product = await Product.findById(productId);
  if (!product) {
    console.error(`Product ${productId} not found`);
    return;
  }


  const url = `https://www.amazon.${product.domain}/dp/${product.asin}`;

  try {
    const { price } = await scrapePriceOnly(url);

    // Always push price to history
    product.priceHistory.push({ price,timestamp: new Date() });

    // Also update current price for reference
    product.currentPrice = price;

    // Keep only last 14 days of price history
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    product.priceHistory = product.priceHistory.filter(entry => entry.timestamp >= twoWeeksAgo);


    await product.save();
    sendPriceDropAlerts(product);

  } catch (error) {
    console.error(`Failed to scrape product ${productId}:`, error.message);
  }
});

// Start agenda and schedule jobs for all products on startup
  async function initAgenda() {
    await agenda.start();
    await agenda.cancel({ name: 'scrape product price' });
    const products = await Product.find();
    products.forEach(product => {
      const job = agenda.create("scrape product price", {productId:product._id});
      job.repeatEvery("30 minutes");
      job.save();
    });
  }

module.exports = { agenda,initAgenda };