// components/charts/ImprovementGraph.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';

const ImprovementGraph = ({ data, autoRefresh = true, refreshInterval = 30000 }) => {
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
        { week: 'Week 1', math: Math.floor(Math.random() * 20) + 60, science: Math.floor(Math.random() * 20) + 65 },
        { week: 'Week 2', math: Math.floor(Math.random() * 20) + 65, science: Math.floor(Math.random() * 20) + 70 },
        { week: 'Week 3', math: Math.floor(Math.random() * 20) + 70, science: Math.floor(Math.random() * 20) + 75 },
        { week: 'Week 4', math: Math.floor(Math.random() * 20) + 75, science: Math.floor(Math.random() * 20) + 80 },
        { week: 'Week 5', math: Math.floor(Math.random() * 20) + 80, science: Math.floor(Math.random() * 20) + 85 },
        { week: 'Week 6', math: Math.floor(Math.random() * 20) + 85, science: Math.floor(Math.random() * 20) + 90 },
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
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Academic Progress
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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="week" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{ color: '#374151', fontWeight: '600' }}
            formatter={(value, name) => [`${value}%`, name]}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '10px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="math" 
            stroke="#4F46E5" 
            strokeWidth={3}
            dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#4F46E5', strokeWidth: 2 }}
            name="Mathematics"
          />
          <Line 
            type="monotone" 
            dataKey="science" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
            name="Science"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {autoRefresh && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Auto-refreshing every {refreshInterval / 1000}s
        </div>
      )}
    </div>
  );
};

export default ImprovementGraph;
