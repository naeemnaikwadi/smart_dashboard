// client/src/components/StudentStatCard.jsx
import React from 'react';

const StudentStatCard = ({ title, value, bgColor = 'bg-white dark:bg-gray-800', textColor = 'text-gray-900 dark:text-white' }) => (
  <div className={`rounded-2xl p-4 transition shadow ${bgColor}`}>
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
      {title}
    </h3>
    <p className={`text-2xl font-bold ${textColor}`}>
      {value}
    </p>
  </div>
);

export default StudentStatCard;
