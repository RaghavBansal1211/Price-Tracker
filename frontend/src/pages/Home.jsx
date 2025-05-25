import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bell, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Chart from '../components/Chart';

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

const Home = () => {
  const [productName, setProductName] = useState('');
  const [productDomain, setProductDomain] = useState('');
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
  const [lastUpdated, setLastUpdated] = useState(null);

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

  const loadProductData = async (url) => {
    setLoading(true);
    setProductAdded(false);
    try {
      const res = await API.post('/products', { url });
      console.log(res);
      toast.success('Product Loaded successfully!');
      setProductAdded(true);
      setPriceHistory(res.data.priceHistory);
      setProductName(res.data.title);
      setProductDomain(res.data.domain);
      setProductImage(res.data.image || '');
      setCurrentPrice(res.data.currentPrice);
      setProductId(res.data._id || 'mock-id');
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to add product.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    await loadProductData(data.url);
    reset({ url: '' });
  };

  const handleRefresh = async () => {
    if (!productId) {
      toast.error('No product to refresh.');
      return;
    }
    setLoading(true);
    try {
      const res = await API.get(`/products/${productId}`);
      setPriceHistory(res.data.priceHistory);
      setProductName(res.data.title);
      setProductDomain(res.data.domain);
      setProductImage(res.data.image || '');
      setCurrentPrice(res.data.currentPrice);
      setLastUpdated(new Date());
      toast.success('Product data refreshed!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to refresh product data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) return toast.error('Enter email first');
    setOtpLoading(true);
    try {
      await API.post('/otp/send', { email });
      setOtpSent(true);
      toast.success('OTP sent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return toast.error('Enter OTP first');
    try {
      const res = await API.post('/otp/verify', { email, code: otp });
      if (res.data.verified) {
        toast.success('Email verified');
        setEmailVerified(true);
        setOtpSent(false);
      } else {
        toast.error('Invalid OTP');
      }
    } catch (err) {
      toast.error('OTP verification failed');
    }
  };

  const handleCreateAlert = async () => {
    try {
      await API.post('/alerts', { productId, email, targetPrice });
      toast.success('Alert created!');
      setShowModal(false);
      setEmailVerified(false);
      setOtpSent(false);
      setEmailChecked(false);
      reset({ email: '', targetPrice: '', otp: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create alert');
    }
  };

  const checkEmailVerification = async () => {
    try {
      const res = await API.post('/otp/check', { email });
      if (res.data.verified) {
        setEmailVerified(true);
        toast.success('Email already verified');
      } else {
        toast.info('Email not verified yet');
      }
      setEmailChecked(true);
    } catch (err) {
      toast.error('Error checking verification');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          📦 Track Amazon Product Price
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-center mb-4">
          <input
            type="text"
            placeholder="Enter Amazon product URL"
            className="flex-grow border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {errors.url && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errors.url.message}</p>
        )}
      </div>

      {productAdded && (
        <div className="mt-8 w-full max-w-5xl flex flex-col lg:flex-row items-start gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow w-full lg:w-1/2 flex flex-col">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {productImage && (
                <img
                  src={productImage}
                  alt={productName}
                  className="w-28 h-28 object-contain rounded border dark:border-gray-700"
                />
              )}
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {productName}
                </h2>
                {currentPrice !== null && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Current Price: {productDomain.includes('in') ? '₹' : '$'}{currentPrice}
                  </p>
                )}
                {lastUpdated && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Last updated: {lastUpdated.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading && (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                )}
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-yellow-300 text-yellow-900 px-4 py-2 rounded-full shadow hover:bg-yellow-400 transition text-sm font-medium"
              >
                <Bell className="w-4 h-4" /> Add Alert
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex flex-col">
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
            <Chart priceHistory={priceHistory} domain={productDomain} />
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg max-w-md w-full mx-4 text-gray-900 dark:text-white">
            <h2 className="text-lg font-semibold mb-4">Set Price Alert</h2>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Email:</label>
              <input
                type="email"
                className="w-full border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                    message: 'Enter a valid email address'
                  }
                })}
              />
              {errors.email && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email.message}</p>}
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

            {emailChecked && !emailVerified && (
              <div className="mb-4">
                {otpSent && (
                  <div className="mb-2">
                    <label className="block mb-2 text-sm font-medium">Enter OTP:</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.otp.message}</p>
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

            {emailVerified && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">Target Price (₹):</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 dark:border-gray-700 px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.targetPrice.message}</p>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEmailVerified(false);
                  setOtpSent(false);
                  setEmailChecked(false);
                  reset({ email: '', targetPrice: '', otp: '' });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
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