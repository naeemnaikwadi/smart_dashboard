import React, { useState, useEffect } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const PieChart = ({ 
  data, 
  title = 'Data Distribution', 
  autoRefresh = true, 
  refreshInterval = 30000,
  height = 300 
}) => {
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
        { name: 'Mathematics', value: Math.floor(Math.random() * 30) + 20, color: '#0088FE' },
        { name: 'Science', value: Math.floor(Math.random() * 30) + 15, color: '#00C49F' },
        { name: 'English', value: Math.floor(Math.random() * 30) + 10, color: '#FFBB28' },
        { name: 'History', value: Math.floor(Math.random() * 30) + 10, color: '#FF8042' },
        { name: 'Art', value: Math.floor(Math.random() * 20) + 5, color: '#8884D8' },
      ];
      
      setChartData(dummyData);
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 500);
  };

  const handleManualRefresh = () => {
    updateChartData();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{`${label}`}</p>
          <p className="text-blue-600 dark:text-blue-400">
            {`Value: ${payload[0].value}`}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {`Percentage: ${((payload[0].value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
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
      
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{
              paddingTop: '10px'
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
      
      {autoRefresh && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Auto-refreshing every {refreshInterval / 1000}s
        </div>
      )}
    </div>
  );
};

export default PieChart;
