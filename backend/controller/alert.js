const Alert = require('../model/alert');
const Product = require('../model/product');

const handleCreateAlert = async (req, res) => {
  const { productId, targetPrice } = req.body;
  const userId = req.user.id;

  try {
    // 1. Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Check for existing alert by same user for same product
    const existingAlert = await Alert.findOne({
      productId,
      'userId.customerId': userId,
    });

    if (existingAlert) {
      return res.status(409).json({ error: 'Alert already exists for this user and product' });
    }

    // 3. Create alert
    const newAlert = new Alert({
      productId,
      userId,
      targetPrice,
    });

    const savedAlert = await newAlert.save();

    res.status(201).json(savedAlert);
  } catch (err) {
    console.error('Error creating alert:', err.message);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};



module.exports = {handleCreateAlert}