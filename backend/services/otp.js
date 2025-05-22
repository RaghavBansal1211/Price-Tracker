const sendEmail = require("./mailSender");

const sendOtpEmail = async (email, code) => {
  await sendEmail(email,'Your PricePulse OTP Code',`Your OTP is: ${code}. It will expire in 10 minutes.`);
};

function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}


module.exports = {sendOtpEmail,generateOtp};
