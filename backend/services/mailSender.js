const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();

const sendEmail = async (to,subject,text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER_EMAIL,  
      pass: process.env.USER_PASS  
    }
  });

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;