const Alert = require('../model/alert');
const sendEmail = require('./mailSender'); 

const sendPriceDropAlerts = async (product) => {
  try {
    const alerts = await Alert.find({
      productId: product._id,
      targetPrice: { $gte: product.currentPrice },
    });

    for (const alert of alerts) {
      const subject = `🔔 Price Drop Alert: ${product.title}`;
      const message = `
        Hi there,

        The price of "${product.title}" has dropped to ₹${product.currentPrice}, 
        which is below your target of ₹${alert.targetPrice}.

        👉 [Click to view](https://www.amazon.${product.domain}/dp/${product.asin})

        - PricePulse
      `;

      await sendEmail(alert.email, subject, message);

      await alert.deleteOne();
    }

  } catch (err) {
    console.error(`Failed to send price alerts for ${product.title}:`, err.message);
  }
};

module.exports = sendPriceDropAlerts;
