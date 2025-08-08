import React from "react";

const tasks = [
  { id: 1, title: "Complete Module 3 of Data Structures", due: "Today" },
  { id: 2, title: "Attend AI Live Session", due: "Tomorrow" },
  { id: 3, title: "Download Web Dev Certificate", due: "This Week" },
  { id: 4, title: "Take Quiz: Machine Learning", due: "Friday" },
];

const WhatToDoList = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">What to Do</h3>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center">
            <span className="text-gray-800 dark:text-gray-200">{task.title}</span>
            <span className="text-sm text-gray-500 dark:text-gray-300">{task.due}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WhatToDoList;
