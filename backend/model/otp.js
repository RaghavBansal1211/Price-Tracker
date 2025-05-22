const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, required: true }
});


const Otp = mongoose.model('otp',OtpSchema);
module.exports = Otp;

