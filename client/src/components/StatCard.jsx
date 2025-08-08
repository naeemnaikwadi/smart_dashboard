// client/src/components/StatCard.jsx

import React from 'react';

export default function StatCard({ label, value, icon, bgColor, textColor }) {
  return (
    <div className={`rounded-md shadow-sm p-3 ${bgColor} ${textColor} flex items-center gap-3`}>
      <div className="text-sm">{React.cloneElement(icon, { size: 20 })}</div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-base font-semibold">{value}</div>
      </div>
    </div>
  );
}
