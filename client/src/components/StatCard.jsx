// client/src/components/StatCard.jsx

import React from 'react';

export default function StatCard({ label, value, icon, bgColor, textColor, subtitle }) {
  return (
    <div className={`rounded-xl shadow-md p-4 ${bgColor} ${textColor} flex items-center gap-4 transition-transform hover:scale-105`}>
      <div className="text-lg">{React.cloneElement(icon, { size: 24 })}</div>
      <div className="flex-1">
        <div className="text-sm font-medium opacity-90">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <div className="text-xs opacity-75 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
