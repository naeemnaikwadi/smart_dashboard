import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${getToastStyles()} transition-all duration-300 ease-in-out`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {type === 'success' ? '✅' : 
           type === 'error' ? '❌' : 
           type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200 text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;



