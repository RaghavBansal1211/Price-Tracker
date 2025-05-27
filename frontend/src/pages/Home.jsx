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
  const [trackLoading, setTrackLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
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
    setTrackLoading(true);
    setProductAdded(false);
    try {
      const res = await API.post('/products', { url });
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
      toast.error(err.response?.data?.error || 'Failed to add product.');
    } finally {
      setTrackLoading(false);
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
    setRefreshLoading(true);
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
      toast.error('Failed to refresh product data.');
    } finally {
      setRefreshLoading(false);
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter Amazon product URL"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            disabled={trackLoading}
            className={`flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
              trackLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {trackLoading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>}
            {trackLoading ? 'Tracking...' : 'Track'}
          </button>
        </form>

        {errors.url && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errors.url.message}</p>}
      </div>

      {productAdded && (
        <div className="mt-8 w-full max-w-5xl flex flex-col lg:flex-row items-start gap-6">
          <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex flex-col">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {productImage && <img src={productImage} alt={productName} className="w-28 h-28 object-contain rounded border dark:border-gray-700" />}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{productName}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Current Price: {productDomain.includes('in') ? '₹' : '$'}{currentPrice}
                </p>
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
                disabled={refreshLoading}
                className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
                  refreshLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {refreshLoading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>}
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
            <Chart priceHistory={priceHistory} domain={productDomain} />
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg max-w-md w-full mx-4 text-gray-900 dark:text-white">
            <h2 className="text-lg font-semibold mb-4">Create Price Alert</h2>

            <input
              {...register('email', { required: true })}
              type="email"
              placeholder="Enter your email"
              className="w-full mb-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />

            <input
              {...register('targetPrice', { required: true })}
              type="number"
              placeholder="Target price"
              className="w-full mb-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />

            {!emailChecked && (
              <button
                className="w-full mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={checkEmailVerification}
              >
                Check Email
              </button>
            )}

            {emailChecked && !emailVerified && !otpSent && (
              <button
                className="w-full mb-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleSendOtp}
                disabled={otpLoading}
              >
                {otpLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            )}

            {otpSent && !emailVerified && (
              <>
                <input
                  {...register('otp', { required: true })}
                  type="text"
                  placeholder="Enter OTP"
                  className="w-full mb-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
                <button
                  onClick={handleVerifyOtp}
                  className="w-full mb-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Verify OTP
                </button>
              </>
            )}

            {emailVerified && (
              <button
                onClick={handleCreateAlert}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Create Alert
              </button>
            )}

            <button onClick={() => setShowModal(false)} className="mt-2 text-sm text-gray-500 underline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
