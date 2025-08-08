// client/src/components/StudentStatCard.jsx
import React from 'react';

const StudentStatCard = ({ title, value }) => (
  <div className="rounded-2xl sudip p-4 transition">
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
      {title}
    </h3>
    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
      {value}
    </p>
  </div>
);

export default StudentStatCard;
