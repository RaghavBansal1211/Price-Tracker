const Otp = require('../model/otp');
const VerifiedEmail = require('../model/verifiedEmail'); 
const {sendOtpEmail} = require('../services/otp');
const {generateOtp} = require('../services/otp');

const handleEmail = async(req,res) =>{
  const {email} = req.body;
  try{
     const result =  await VerifiedEmail.findOne({email:email});
    if(result) return res.status(200).json({verified:true})
    return res.status(200).json({verified:false}) 
  }
  catch(err){
    return res.status(500).json({message:"Server Error"})
  }
 
}

const sendOtp = async (req, res) => {
  const { email } = req.body;

  const cooldownMs = 60 * 1000; // 1 min
  const existing = await Otp.findOne({ email });

  if (existing) {
    const now = Date.now();
    const timeSinceLast = now - new Date(existing.lastSentAt).getTime();

    if (timeSinceLast < cooldownMs) {
      const waitTime = Math.ceil((cooldownMs - timeSinceLast) / 1000);
      return res.status(429).json({ error: `Wait ${waitTime}s to resend OTP.` });
    }
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await Otp.findOneAndUpdate(
    { email },
    { code, expiresAt, lastSentAt: new Date() },
    { upsert: true, new: true }
  );

  await sendOtpEmail(email, code);
  res.json({ message: 'OTP sent to email' });
};



const verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  const record = await Otp.findOne({ email });

  if (!record || record.code !== code) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  if (record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  // Mark email as verified
  await VerifiedEmail.findOneAndUpdate(
    { email },
    { email, verifiedAt: new Date() },
    { upsert: true }
  );

  await Otp.deleteOne({ email }); // remove used OTP

  res.json({ verified: true });
};

module.exports = {sendOtp,verifyOtp,handleEmail};