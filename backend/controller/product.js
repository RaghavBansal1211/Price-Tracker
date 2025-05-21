const Product = require('../model/product');
const {scrapeFullProduct} = require('../services/scraper'); // You implement this

exports.handleAddProduct = async (req, res) => {
  const { url } = req.body;
  try {
    const { title, price, image } = await scrapeFullProduct(url);

    const newProduct = new Product({
      url,
      title,
      image,
      currentPrice: price,
      priceHistory: [{ price }]
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Error adding product:', err.message);
    res.status(500).json({ error: 'Failed to scrape or save product' });
  }
};


exports.handleGetProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err.message);
    res.status(500).json({ error: 'Failed to get product' });
  }
};
