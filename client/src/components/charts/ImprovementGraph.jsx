// components/charts/ImprovementGraph.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ImprovementGraph = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="week" stroke="#82ca9d" />
        <YAxis stroke="#82ca9d" />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#82ca9d" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ImprovementGraph;
