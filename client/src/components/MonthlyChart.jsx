// client/src/components/MonthlyChart.jsx

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw } from 'lucide-react';

const MonthlyChart = ({ data, autoRefresh = true, refreshInterval = 30000 }) => {
  const [chartData, setChartData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    updateChartData();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        updateChartData();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [data, autoRefresh, refreshInterval]);

  const updateChartData = () => {
    setRefreshing(true);
    
    // Simulate real-time data update
    setTimeout(() => {
      const dummyData = data.length ? data : [
        { month: 'Jan', enrollments: Math.floor(Math.random() * 20) + 5 },
        { month: 'Feb', enrollments: Math.floor(Math.random() * 20) + 5 },
        { month: 'Mar', enrollments: Math.floor(Math.random() * 20) + 5 },
        { month: 'Apr', enrollments: Math.floor(Math.random() * 20) + 5 },
        { month: 'May', enrollments: Math.floor(Math.random() * 20) + 5 },
        { month: 'Jun', enrollments: Math.floor(Math.random() * 20) + 5 },
      ];
      
      setChartData(dummyData);
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 500);
  };

  const handleManualRefresh = () => {
    updateChartData();
  };

  return (
    <div className="h-full w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Monthly Enrollments
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      <div className="h-[calc(100%-60px)] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#374151', fontWeight: '600' }}
            />
            <Line 
              type="monotone" 
              dataKey="enrollments" 
              stroke="#4F46E5" 
              strokeWidth={3}
              dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {autoRefresh && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Auto-refreshing every {refreshInterval / 1000}s
        </div>
      )}
    </div>
  );
};

export default MonthlyChart;