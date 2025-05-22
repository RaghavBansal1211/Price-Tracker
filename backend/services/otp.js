const nodemailer = require('nodemailer');

const sendOtpEmail = async (to,subject,text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "raghavbansal1211@gmail.com",  
      pass: "kgjw nicc zosk ccgp"  
    }
  });

  const mailOptions = {
    from: "raghavbansal1211@gmail.com",
    to,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
};


function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
}


module.exports = {sendOtpEmail,generateOtp};
