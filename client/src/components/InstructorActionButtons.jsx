// client/src/components/InstructorActionButtons.jsx

import React from 'react';
import { PlusCircle, Monitor, Users, MoreHorizontal } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const InstructorActionButtons = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Create Classroom',
      description: 'Setup a new classroom and add resources.',
      actionText: 'Create',
      onClick: () => navigate('/create-classroom'),
    },
    {
      title: 'Classrooms',
      description: 'View and manage your classrooms.',
      actionText: 'View',
      onClick: () => navigate('/instructor/classrooms'),
    },
    {
      title: 'Student Info',
      description: 'Check student performance and progress.',
      actionText: 'Check',
      onClick: () => navigate('/student-info'),
    },
    {
      title: 'More',
      description: 'Additional tools and features.',
      actionText: 'Explore',
      onClick: () => alert('More tools coming soon'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg transition"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{action.title}</h4>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{action.description}</p>
          <button
            onClick={action.onClick}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {action.actionText}
          </button>
        </div>
      ))}
    </div>
  );
};

export default InstructorActionButtons;