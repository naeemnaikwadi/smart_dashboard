import React, { useState } from 'react';
import ConfirmJoinClassroomModal from '../components/ConfirmJoinClassroomModal';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const JoinClassroom = () => {
  const navigate = useNavigate();
  const [entryCode, setEntryCode] = useState('');


  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.get(`http://localhost:4000/api/classrooms/find-by-code/${entryCode}`);

      setClassroom(response.data.classroom); // Set classroom data
      setIsModalOpen(true); // Open modal on success
      setSuccess('Classroom found! Please confirm to join.');
    } catch (error) {
      console.error('Error joining classroom:', error);
      setError(error.response?.data?.error || 'Invalid entry code or classroom not found');
    } finally {
      setLoading(false);
    }
  };



  const handleModalClose = () => {
    setIsModalOpen(false);
    setClassroom(null); // Clear classroom data on modal close
  };

  const handleJoinSuccess = () => {
    setIsModalOpen(false);
    setClassroom(null); // Clear classroom data on successful join
    setSuccess('Successfully joined the classroom!');
    setTimeout(() => {
      navigate('/student-dashboard');
    }, 2000);
  };

  return (
    <DashboardLayout role="student">
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-indigo-900 dark:text-white">Join Classroom</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <form onSubmit={handleJoinClassroom} className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Classroom Code
              </label>
              <input
                type="text"
                value={entryCode}
                onChange={(e) => setEntryCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code (e.g., ABC123)"
                maxLength="6"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !entryCode}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                loading || !entryCode
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {loading ? 'Finding Classroom...' : 'Join Classroom'}
            </button>
          </form>
        </div>


      </div>

      <ConfirmJoinClassroomModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onJoinSuccess={handleJoinSuccess}
          classroom={classroom}
        />
    </DashboardLayout>
  );
};

export default JoinClassroom;