import React, { useState } from "react";
import { useNavigate } from "react-router-dom";



const actions = [
  {
    title: "My Courses",
    description: "Explore your enrolled courses and start learning.",
    actionText: "Go to Courses",
    path: "/student/courses"
  },
  {
    title: "Join Live Session",
    description: "Participate in real-time instructor-led sessions.",
    actionText: "Join Now",
    path: "/student/live-sessions"
  },
  {
    title: "Classrooms",
    description: "Explore your enrolled classrooms and start learning.",
    actionText: "Explore",
    path: "/student/classrooms"
  },
  {
    title: "Downloads",
    description: "View your downloaded resources and documents.",
    actionText: "View",
    path: "/student/downloads"
  },
];

export default function StudentActionButtons() {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (action.title === "Classrooms") {
      navigate(action.path);
    } else {
      navigate(action.path);
    }
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col justify-between transition"
          >
            <div>
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
                {action.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {action.description}
              </p>
            </div>
            <button 
              onClick={() => handleAction(action)}
              className="mt-4 self-start px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {action.actionText}
            </button>
          </div>
        ))}
      </div>


    </>
  );
}
