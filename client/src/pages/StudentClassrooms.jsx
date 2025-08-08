import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import ConfirmJoinClassroomModal from '../components/ConfirmJoinClassroomModal';
import JoinClassroomPromptModal from '../components/JoinClassroomPromptModal';

const StudentClassrooms = () => {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [classroomToJoin, setClassroomToJoin] = useState(null);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token || !user) {
        console.log('No token or user found');
        return;
      }

      const userId = JSON.parse(user)._id || JSON.parse(user).id;
      console.log('Fetching classrooms for user:', userId);

      const response = await axios.get(`http://localhost:4000/api/classrooms/student/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Classrooms response:', response.data);
      setClassrooms(response.data);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError('Authentication failed. Please try logging in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading classrooms...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Your Classrooms</h2>
          <button
            onClick={() => setIsPromptModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Join Classroom
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No classrooms joined yet.
            </p>
            <button
              onClick={() => setIsPromptModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg mt-4"
            >
              Join a Classroom
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div key={classroom._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {classroom.name}
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {classroom.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Course:</span> {classroom.course}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Date:</span> {formatDate(classroom.date)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Students:</span> {classroom.students?.length || 0}
                  </p>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => navigate(`/student/classroom/${classroom._id}`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Open Classroom
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <JoinClassroomPromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          onClassroomFound={(classroom) => {
            setClassroomToJoin(classroom);
            setIsPromptModalOpen(false);
            setIsConfirmModalOpen(true);
          }}
        />

        {classroomToJoin && (
          <ConfirmJoinClassroomModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onJoinSuccess={() => {
              setIsConfirmModalOpen(false);
              fetchClassrooms();
              setClassroomToJoin(null);
            }}
            classroom={classroomToJoin}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentClassrooms;
