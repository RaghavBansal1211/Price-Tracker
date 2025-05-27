import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../pages/apiConfig';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrackedProducts = async () => {
      try {
        const res = await API.get('/products/fetchAll');
        setProducts(res.data || []);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackedProducts();
  }, []);

  const handleProductClick = (productId) => {
    navigate(`/?productId=${productId}`);
  };

  return (
    <div className="pt-16 px-4 py-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold mb-6">📋 My Tracked Products</h2>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">You are not tracking any products yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              onClick={() => handleProductClick(product._id)}
              className="cursor-pointer bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-blue-500 transition"
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-40 object-contain mb-4 rounded"
                />
              )}
              <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                Current Price: {product.domain?.includes('in') ? '₹' : '$'}
                {product.currentPrice}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last Updated: {new Date(product.updatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts;
