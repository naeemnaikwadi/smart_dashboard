// components/charts/TimeSpentChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TimeSpentChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="day" stroke="#8884d8" />
        <YAxis stroke="#8884d8" />
        <Tooltip />
        <Bar dataKey="minutes" fill="#8884d8" barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TimeSpentChart;
