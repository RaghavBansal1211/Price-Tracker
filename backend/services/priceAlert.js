const Alert = require('../model/alert');
const sendEmail = require('./mailSender');

const sendPriceDropAlerts = async (product) => {
  try {
    // 1. Find all alerts where the target price is higher than or equal to the current price
    const alerts = await Alert.find({
      productId: product._id,
      targetPrice: { $gte: product.currentPrice },
    }).populate('userId', 'email'); 

    for (const alert of alerts) {
      const userEmail = alert.userId?.email;
      if (!userEmail) continue; 

      const subject = `🔔 Price Drop Alert: ${product.title}`;
      const message = `
        Hi there,

        The price of "${product.title}" has dropped to ₹${product.currentPrice}, 
        which is below your target of ₹${alert.targetPrice}.

        👉 [Click to view](https://www.amazon.${product.domain}/dp/${product.asin})

        - PricePulse
      `;

      await sendEmail(userEmail, subject, message);

      // delete the alert once it's triggered
      await alert.deleteOne();
    }
  } catch (err) {
    console.error(`Failed to send price alerts for ${product.title}:`, err.message);
  }
};

module.exports = sendPriceDropAlerts;
