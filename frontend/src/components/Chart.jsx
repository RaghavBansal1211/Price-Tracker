import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const formatDate = (timestamp) =>
  new Date(timestamp).toISOString().split('T')[0];

const Chart = ({ priceHistory, domain }) => {
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-500 dark:text-gray-400">
        No price history available.
      </div>
    );
  }

  const groupedByDate = useMemo(() => {
    const grouped = {};
    priceHistory.forEach((entry) => {
      const date = formatDate(entry.timestamp);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });
    return grouped;
  }, [priceHistory]);

  const allDates = Object.keys(groupedByDate).sort((a, b) =>
    new Date(a) - new Date(b)
  );
  const [selectedDateIndex, setSelectedDateIndex] = useState(allDates.length - 1);
  const selectedDate = allDates[selectedDateIndex];
  const dailyData = groupedByDate[selectedDate];

  const currency = domain?.includes('in') ? '₹' : '$';

  const minPrice = Math.min(...dailyData.map(p => p.price));
  const maxPrice = Math.max(...dailyData.map(p => p.price));
  const avgPrice = (
    dailyData.reduce((sum, p) => sum + p.price, 0) / dailyData.length
  ).toFixed(2);

  return (
    <div className="w-full h-full p-4 bg-white dark:bg-gray-800 shadow rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Price History - {selectedDate}
        </h2>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setSelectedDateIndex(i => Math.max(0, i - 1))}
            disabled={selectedDateIndex === 0}
            className="p-2 rounded bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {selectedDate}
          </span>
          <button
            onClick={() =>
              setSelectedDateIndex(i => Math.min(allDates.length - 1, i + 1))
            }
            disabled={selectedDateIndex === allDates.length - 1}
            className="p-2 rounded bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Min: {currency}{minPrice} | Max: {currency}{maxPrice} | Avg: {currency}{avgPrice}
      </div>

      <div
        className="w-full h-64 flex justify-center items-center"
        style={{ maxWidth: 600, margin: '0 auto', flexShrink: 1, minWidth: 0 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dailyData}
            // Adjust margins here to balance space for Y axis & centering
            margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
          >
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time) =>
                new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
              stroke="#8884d8"
              tickMargin={10}
              padding={{ left: 0, right: 10 }}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#8884d8"
              tickMargin={10}
              padding={{ top: 10, bottom: 10 }}
              width={40}  // Fix width explicitly so Y axis doesn't shift
            />
            <Tooltip
              labelFormatter={(time) => new Date(time).toLocaleTimeString()}
              formatter={(value) => `${currency}${value}`}
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
