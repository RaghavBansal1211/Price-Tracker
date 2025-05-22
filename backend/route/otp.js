// routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, handleEmail } = require('../controller/otp');

router.post('/send', sendOtp);
router.post('/verify', verifyOtp);
router.post('/check',handleEmail);

module.exports = router;
