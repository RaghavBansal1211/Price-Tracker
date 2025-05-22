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
      <div className="flex justify-center items-center py-10 text-gray-500">
        No price history available.
      </div>
    );
  }

  return (
    <div className="w-[100%] h-80 p-4 bg-white shadow rounded-xl">
      <h2 className="text-lg font-semibold mb-4">Price History</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
            data={priceHistory}
            margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
            dataKey="timestamp"
            tickFormatter={(time) => new Date(time).toLocaleDateString()}
            padding={{ left: 20, right: 20,bottom:20}}
            />
            <YAxis
            dataKey="price"
            domain={['auto', 'auto']}
            padding={{ top: 0, bottom: 10 }}
            />
            <Tooltip labelFormatter={(time) => new Date(time).toLocaleString()} />
            <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
};

export default Chart;
