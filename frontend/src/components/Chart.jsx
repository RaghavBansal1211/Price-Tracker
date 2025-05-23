// Chart.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Chart = ({ priceHistory }) => {
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-500 dark:text-gray-400">
        No price history available.
      </div>
    );
  }
  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const avgPrice = (
    priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length
  ).toFixed(2);

  return (
    <div className="w-full h-full p-4 bg-white dark:bg-gray-800 shadow rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">Price History</h2>
        {/* {lastFetchedAt && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
            Last Fetched: {new Date(lastFetchedAt).toLocaleString()}
          </p>
        )} */}
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Min: ₹{minPrice} | Max: ₹{maxPrice} | Avg: ₹{avgPrice}
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={priceHistory}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={"#ccc"} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time) => new Date(time).toLocaleDateString()}
              stroke="#8884d8"
            />
            <YAxis domain={['auto', 'auto']} stroke="#8884d8" />
            <Tooltip
              labelFormatter={(time) => new Date(time).toLocaleString()}
              formatter={(value) => `₹${value}`}
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563', color: '#f9fafb' }}
              labelStyle={{ color: '#f9fafb' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;
