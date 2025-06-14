const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  userId:[
    {
      customerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
      }
    }
  ],

  asin: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  priceHistory: [
    {
      price: {
        type: Number,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

const Product = mongoose.model('product', productSchema);
module.exports = Product;
