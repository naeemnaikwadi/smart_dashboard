import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import ConfirmJoinClassroomModal from '../components/ConfirmJoinClassroomModal';
import JoinClassroomPromptModal from '../components/JoinClassroomPromptModal';
import { BookOpen, Plus, Users, Target, Eye, ArrowRight } from 'lucide-react';

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
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Your Classrooms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Access your learning spaces and continue your educational journey
            </p>
          </div>
          <button
            onClick={() => setIsPromptModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
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
              <div key={classroom._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {classroom.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Joined {formatDate(classroom.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {classroom.description || 'No description provided'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Students</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {classroom.students?.length || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Courses</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {classroom.courses?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/student/classroom/${classroom._id}`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 group-hover:scale-105"
                  >
                    <Eye className="w-5 h-5" />
                    Open Classroom
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
