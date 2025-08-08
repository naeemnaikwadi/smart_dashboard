// components/StudentList.jsx
import React from 'react';

const StudentList = ({ students, onSelect }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
      <h2 className="text-lg font-semibold mb-3 dark:text-white">Students</h2>
      <ul className="space-y-2">
        {students.map((student) => (
          <li
            key={student._id}
            onClick={() => onSelect(student._id)}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
          >
            {student.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
