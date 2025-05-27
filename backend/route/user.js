const express = require('express');
const router = express.Router();
const { requestEmailVerification, verifyOtpAndRegister, handleUserLogIn } = require('../controller/user');

router.post('/send-otp', requestEmailVerification);
router.post('/verify-otp', verifyOtpAndRegister);
router.post('/login',handleUserLogIn);


module.exports = router;
