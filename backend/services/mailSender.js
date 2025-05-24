const nodemailer = require('nodemailer');

const sendEmail = async (to,subject,text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER_EMAIL,  
      pass: process.env.USER_PASS  
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

module.exports = sendEmail;