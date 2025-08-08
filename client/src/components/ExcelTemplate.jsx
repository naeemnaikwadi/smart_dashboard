import React from 'react';

const ExcelTemplate = () => {
  const downloadTemplate = () => {
    // Create a simple CSV template that can be opened in Excel
    const csvContent = "name,email,studentId\nJohn Doe,john.doe@email.com,STU001\nJane Smith,jane.smith@email.com,STU002";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_list_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
        📋 Excel Template
      </h4>
      <p className="text-blue-600 dark:text-blue-300 text-sm mb-3">
        Download a template to help you format your student list correctly.
      </p>
      <button
        onClick={downloadTemplate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
      >
        Download Template
      </button>
      <div className="mt-3 text-xs text-blue-600 dark:text-blue-300">
        <p><strong>Required columns:</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li><code>name</code> - Student's full name</li>
          <li><code>email</code> - Student's email address</li>
          <li><code>studentId</code> - Student ID (optional)</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelTemplate; 