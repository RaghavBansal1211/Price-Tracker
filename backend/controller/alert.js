const Alert = require('../model/alert');
const Product = require('../model/product');
const VerifiedEmail = require('../model/verifiedEmail');

exports.handleCreateAlert = async (req, res) => {
  const { productId, email, targetPrice } = req.body;

  try {
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if email is verified
    const verified = await VerifiedEmail.findOne({ email });
    if (!verified) {
      return res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
    }

    // Create alert
    const newAlert = new Alert({ productId, email, targetPrice });
    const savedAlert = await newAlert.save();

    res.status(201).json(savedAlert);
  } catch (err) {
    console.error('Error creating alert:', err.message);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

exports.handleGetAlert = async (req, res) => {
  try {
    const alerts = await Alert.find({ productId: req.params.productId });
    res.json(alerts);
  } catch (err) {
    console.error('Error fetching alerts:', err.message);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
};
