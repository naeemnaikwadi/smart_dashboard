// components/charts/TimeSpentChart.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw, Clock } from 'lucide-react';

const TimeSpentChart = ({ data, autoRefresh = true, refreshInterval = 30000 }) => {
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
      const dummyData = (data && data.length) ? data : [
        { subject: 'Math', timeSpent: Math.floor(Math.random() * 120) + 30 },
        { subject: 'Science', timeSpent: Math.floor(Math.random() * 120) + 30 },
        { subject: 'English', timeSpent: Math.floor(Math.random() * 120) + 30 },
        { subject: 'History', timeSpent: Math.floor(Math.random() * 120) + 30 },
        { subject: 'Art', timeSpent: Math.floor(Math.random() * 120) + 30 },
      ];
      
      setChartData(dummyData);
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 500);
  };

  const handleManualRefresh = () => {
    updateChartData();
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Time Spent by Subject
          </h3>
        </div>
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
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="subject" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickFormatter={(value) => `${value}m`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
            formatter={(value) => [formatTime(value), 'Time Spent']}
          />
          <Bar 
            dataKey="timeSpent" 
            fill="#10B981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {autoRefresh && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Auto-refreshing every {refreshInterval / 1000}s
        </div>
      )}
    </div>
  );
};

export default TimeSpentChart;
