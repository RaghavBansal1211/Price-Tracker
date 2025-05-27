const bcrypt = require('bcrypt');
const User = require('../model/user');
const Otp = require('../model/otp');
const { setUser } = require('../services/auth');
const { generateOtp, sendOtpEmail } = require('../services/otp');

// STEP 1: Submit form -> Check email + send OTP
const requestEmailVerification = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const cooldownMs = 60 * 1000;
    const existingOtp = await Otp.findOne({ email });
    if (existingOtp) {
      const timeSinceLast = Date.now() - new Date(existingOtp.lastSentAt).getTime();
      if (timeSinceLast < cooldownMs) {
        const wait = Math.ceil((cooldownMs - timeSinceLast) / 1000);
        return res.status(429).json({ message: `Wait ${wait}s to resend OTP` });
      }
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await Otp.findOneAndUpdate(
      { email },
      {
        code,
        expiresAt,
        lastSentAt: new Date(),
        name,
        password, 
      },
      { upsert: true }
    );

    await sendOtpEmail(email, code);
    res.status(200).json({ message: 'OTP sent to email' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// STEP 2: Submit OTP -> Verify and Create User
const verifyOtpAndRegister = async (req, res) => {
  const { email, code } = req.body;

  try {
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord || otpRecord.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(otpRecord.password, 10);

    const user = new User({
      name: otpRecord.name,
      email,
      password: hashedPassword,
    });

    await user.save();
    await Otp.deleteOne({ email });


    res.status(201).json({
      message: 'User registered and verified successfully',
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  requestEmailVerification,
  verifyOtpAndRegister,
};



const handleUserLogIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Generate JWT
    const token = setUser(user);

    // 5. Respond with token and user info
    res.status(200).json({
      message: 'Login successful',
      success:true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requestEmailVerification,verifyOtpAndRegister,handleUserLogIn };
