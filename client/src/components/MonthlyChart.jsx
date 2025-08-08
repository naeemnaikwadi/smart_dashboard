// client/src/components/MonthlyChart.jsx

import React from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/*export default function MonthlyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="month" stroke="#4f46e5" fontSize={10} />
        <YAxis stroke="#4f46e5" fontSize={10} />
        <Tooltip />
        <Line type="monotone" dataKey="enrollments" stroke="#4f46e5" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}*/
const MonthlyChart = ({ data }) => {
  const dummyData = data.length ? data : [
    { month: 'Jan', enrollments: 5 },
    { month: 'Feb', enrollments: 10 },
    { month: 'Mar', enrollments: 6 },
    { month: 'Apr', enrollments: 12 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dummyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="enrollments" stroke="#4F46E5" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;