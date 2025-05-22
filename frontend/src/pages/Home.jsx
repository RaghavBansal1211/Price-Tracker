import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bell } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Chart from '../components/Chart';

const Home = () => {
  const [productName, setProductName] = useState('');
  const [productImage, setProductImage] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productAdded, setProductAdded] = useState(false);
  const [productId, setProductId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [emailChecked, setEmailChecked] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm();

  const email = watch('email');
  const targetPrice = watch('targetPrice');
  const otp = watch('otp');

  const onSubmit = async (data) => {
    setLoading(true);
    setProductAdded(false);

    try {
      const res = await axios.post('http://localhost:8000/api/products', { url: data.url });
      toast.success('Product Loaded successfully!');
      setProductAdded(true);
      console.log(res.data);
      setPriceHistory(res.data.priceHistory);
      setProductName(res.data.title);
      setProductImage(res.data.image || '');
      setCurrentPrice(res.data.currentPrice);
      setProductId(res.data._id || 'mock-id');
      reset({ url: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to add product.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
  if (!email) {
    toast.error('Please enter an email first.');
    return;
  }
  setOtpLoading(true);

  try {
    await axios.post('http://localhost:8000/api/otp/send', { email });
    toast.success(otpSent ? 'OTP resent to your email' : 'OTP sent to your email');
    setOtpSent(true);
  } catch (error) {
    if (error.response?.status === 429) {
      // Show specific rate limit error message from the server, fallback generic message
      toast.error(error.response.data?.error || 'Too many requests. Please wait before retrying.');
    } else {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP');
    }
  } finally {
    setOtpLoading(false);
  }
};

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error('Please enter the OTP.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:8000/api/otp/verify', {
        email,
        code: otp
      });

      if (res.data.verified) {
        toast.success('Email verified successfully!');
        setEmailVerified(true);
        setOtpSent(false);
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('OTP verification failed');
    }
  };

  const handleCreateAlert = async () => {
    if (!targetPrice) {
      toast.error('Please enter a target price.');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/alerts', {
        productId,
        email,
        targetPrice: parseFloat(targetPrice)
      });
      toast.success('Price alert created successfully!');
      setShowModal(false);
      setEmailVerified(false);
      setOtpSent(false);
      setEmailChecked(false);
      reset({ email: '', targetPrice: '', otp: '' });
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error(error.response?.data?.error || 'Failed to create alert.');
    }
  };

  const checkEmailVerification = async () => {
    if (!email || errors.email){
        toast.error('Enter Valid Email');
        return;
    }

    try {
      const res = await axios.post('http://localhost:8000/api/otp/check', { email });

      if (res.data.verified) {
        toast.success('Email is verified!');
        setEmailVerified(true);
        setOtpSent(false);
      } else {
        toast.info('Email not verified. Please verify via OTP.');
        setEmailVerified(false);
        setOtpSent(false);
      }
      setEmailChecked(true);
    } catch (error) {
      console.error('Error checking email verification:', error);
      setEmailVerified(false);
      setOtpSent(false);
      setEmailChecked(true);
      toast.error('Failed to check verification.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          📦 Track Amazon Product Price
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-center mb-4">
          <input
            type="text"
            placeholder="Enter Amazon product URL"
            className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('url', {
              required: 'Amazon URL is required',
              validate: {
                isAmazonUrl: (value) =>
                  value.includes('amazon') || 'Please enter a valid Amazon URL',
                isValidUrl: (value) => {
                  try {
                    new URL(value);
                    return true;
                  } catch {
                    return 'Please enter a valid URL';
                  }
                }
              }
            })}
          />
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading && (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
            )}
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>

        {errors.url && <p className="text-sm text-red-600 mb-4">{errors.url.message}</p>}

        {productAdded && (
          <div className="mt-6 w-full flex justify-center">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-yellow-300 text-yellow-900 px-4 py-2 rounded-full shadow hover:bg-yellow-400 transition text-sm font-medium"
            >
              <Bell className="w-4 h-4" />
              Add Alert
            </button>
          </div>
        )}
      </div>

      {productAdded && (
        <div className="mt-8 w-full max-w-2xl bg-white p-4 rounded-xl shadow">
            <div className="flex flex-col sm:flex-row items-center gap-4">
            {productImage && (
                <img
                src={`http://localhost:8000/${productImage}`}
                alt={productName}
                className="w-28 h-28 object-contain rounded border"
                />
            )}
            <div className="text-center sm:text-left">
                <h2 className="text-lg font-semibold text-gray-800">{productName}</h2>
                {currentPrice !== null && (
                <p className="text-sm text-gray-600 mt-1">Current Price: ₹{currentPrice}</p>
                )}
            </div>
            </div>
        </div>
      )}
 
      <br/>
      <Chart priceHistory={priceHistory}/>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Set Price Alert</h2>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Email:</label>
              <input
                type="email"
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                    message: 'Enter a valid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}

              {!emailChecked && (
                <button
                  type="button"
                  onClick={checkEmailVerification}
                  className="mt-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Check Verification
                </button>
              )}
            </div>

            {/* OTP Buttons */}
            {emailChecked && !emailVerified && (
            <div className="mb-4">
                {otpSent && (
                <div className="mb-2">
                    <label className="block mb-2 text-sm font-medium">Enter OTP:</label>
                    <input
                    type="text"
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 6-digit OTP"
                    {...register('otp', {
                        required: 'OTP is required',
                        pattern: {
                        value: /^\d{6}$/,
                        message: 'Enter a valid 6-digit OTP'
                        }
                    })}
                    />
                    {errors.otp && (
                    <p className="text-sm text-red-600 mt-1">{errors.otp.message}</p>
                    )}
                </div>
                )}

                <div className="flex gap-2">
                <button
                    onClick={handleSendOtp}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70"
                    disabled={otpLoading}
                    >
                    {otpLoading && (
                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                    )}
                    {otpSent ? 'Resend OTP' : 'Get OTP'}
                    </button>
                <button
                    onClick={handleVerifyOtp}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                    Verify OTP
                </button>
                </div>
            </div>
            )}
            {/* Target Price Input */}
            {emailVerified && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Target Price (₹):</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 15000"
                  {...register('targetPrice', {
                    required: 'Target price is required',
                    min: {
                      value: 1,
                      message: 'Price must be greater than 0'
                    }
                  })}
                />
                {errors.targetPrice && (
                  <p className="text-sm text-red-600 mt-1">{errors.targetPrice.message}</p>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEmailVerified(false);
                  setOtpSent(false);
                  setEmailChecked(false);
                  reset({ email: '', targetPrice: '', otp: '' });
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              {emailVerified && (
                <button
                  onClick={handleCreateAlert}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Create Alert
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
