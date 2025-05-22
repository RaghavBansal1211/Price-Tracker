// models/VerifiedEmail.js
const mongoose = require('mongoose');

const VerifiedEmailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  verifiedAt: { type: Date, default: Date.now }
});


const VerifiedEmail = mongoose.model('verifiedEmail',VerifiedEmailSchema);
module.exports = VerifiedEmail;


