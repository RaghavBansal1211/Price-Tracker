import React, { useState,useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Bell, RefreshCw, Menu } from 'lucide-react';
import Chart from '../components/Chart';
import API from '../pages/apiConfig'
import { useNavigate,useLocation } from 'react-router-dom';
 import 'react-toastify/dist/ReactToastify.css'; 

const HomeContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [productName, setProductName] = useState('');
  const [productDomain, setProductDomain] = useState('');
  const [productImage, setProductImage] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [productAdded, setProductAdded] = useState(false);
  const [productId, setProductId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  const {
    register,
    handleSubmit,   
    watch,
    reset,
    formState: { errors }
  } = useForm();

  const targetPrice = watch('targetPrice');

  const onSubmit = async (data) => {
    setLoading(true);
    setProductAdded(false);
    try {
      const res = await API.post('/products', { url: data.url });
      toast.success('Product Loaded successfully!');
      setProductAdded(true);
      setPriceHistory(res.data.priceHistory);
      setProductName(res.data.title);
      setProductDomain(res.data.domain);
      setProductImage(res.data.image || '');
      setCurrentPrice(res.data.currentPrice);
      setProductId(res.data._id || '');
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add product.');
    } finally {
      setLoading(false);
      reset({ url: '' });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryProductId = params.get('productId');

    if (queryProductId) {
      const fetchProductById = async () => {
        setLoading(true);
        setProductAdded(false);
        try {
          const res = await API.get(`/products/${queryProductId}`);
          const p = res.data;
          setProductAdded(true);
          setPriceHistory(p.priceHistory || []);
          setProductName(p.title || '');
          setProductDomain(p.domain || '');
          setProductImage(p.image || '');
          setCurrentPrice(p.currentPrice || null);
          setProductId(p._id || '');
          setLastUpdated(new Date(p.updatedAt) || new Date());
        } catch (error) {
          toast.error('Failed to load product from URL');
        } finally {
          setLoading(false);
        }
      };

      fetchProductById();
    }
  }, [location.search]);

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

const handleCreateAlert = async () => {
  if (!targetPrice || targetPrice <= 0) {
    return toast.error('Please enter a valid target price');
  }

  try {
    const res = await API.post('/alerts', { productId, targetPrice });
    if (res.data?.success || res.status === 201) {
      toast.success('Alert created!');
    } else {
      toast.error('Failed to create alert');
    }

    setShowModal(false);
    reset({ targetPrice: '' });
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to create alert');
  }
};


  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload(); // Reload the app to update auth state
  };

 const handleMyProductsClick = () => {
    navigate('/my-products');
  };

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">PricePulse</h1>
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={handleMyProductsClick} className="text-gray-800 dark:text-gray-200 hover:text-blue-600">My Products</button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-800">Log Out</button>
          </div>
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="md:hidden text-gray-900 dark:text-white"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        {navOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 px-4 pb-4 space-y-2">
            <button onClick={handleMyProductsClick} className="block w-full text-left text-gray-800 dark:text-gray-200">My Products</button>
            <button onClick={handleLogout} className="block w-full text-left text-red-600">Log Out</button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-10 flex flex-col items-center">
        <div className="w-full max-w-xl">
          <h1 className="text-3xl font-bold text-center mb-6">📦 Track Amazon Product Price</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-center mb-4">
            <input
              type="text"
              placeholder="Enter Amazon product URL"
              className="flex-grow border rounded-lg px-4 py-2 bg-white dark:bg-gray-800"
              {...register('url', {
                required: 'Amazon URL is required',
                validate: {
                  isAmazonUrl: (value) =>
                    value.includes('amazon') || 'Must be an Amazon URL',
                  isValidUrl: (value) => {
                    try {
                      new URL(value);
                      return true;
                    } catch {
                      return 'Invalid URL';
                    }
                  }
                }
              })}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 min-w-[80px]"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </form>
          {errors.url && (
            <p className="text-sm text-red-600 mb-4">{errors.url.message}</p>
          )}
        </div>

        {productAdded && (
          <div className="mt-8 w-full max-w-5xl flex flex-col lg:flex-row gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow w-full lg:w-1/2 self-start">
              <div className="flex items-center gap-4">
                {productImage && (
                  <img src={productImage} alt={productName} className="w-24 h-24 object-contain rounded" />
                )}
                <div>
                  <h2 className="text-lg font-semibold">{productName}</h2>
                  <p>
                    Current Price: {productDomain.includes('in') ? '₹' : '$'}
                    {currentPrice}
                  </p>
                  {lastUpdated && (
                    <p className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={handleRefresh}
                  disabled={refreshLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {refreshLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-yellow-300 text-yellow-900 px-4 py-2 rounded-full hover:bg-yellow-400"
                >
                  <Bell className="inline-block w-4 h-4 mr-1" />
                  Add Alert
                </button>
              </div>
            </div>

            <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
              <Chart priceHistory={priceHistory} domain={productDomain} />
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-md w-full text-black dark:text-white">
              <h2 className="text-lg font-semibold mb-4">Set Price Alert</h2>
              <input
                type="number"
                placeholder="Target Price" 
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                {...register('targetPrice', {
                  required: 'Target price is required',
                  min: { value: 1, message: 'Must be greater than zero' }
                })}
              />
              {errors.targetPrice && (
                <p className="text-sm text-red-600 mt-1">{errors.targetPrice.message}</p>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    reset({ targetPrice: '' });
                    setShowModal(false);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded hover:bg-yellow-500"
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HomeContent;
