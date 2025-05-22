// routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controller/otp');

router.post('/send', sendOtp);
router.post('/verify', verifyOtp);

module.exports = router;
