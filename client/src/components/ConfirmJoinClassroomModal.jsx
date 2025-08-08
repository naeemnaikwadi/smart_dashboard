import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

export default function ConfirmJoinClassroomModal({ isOpen, onClose, onJoinSuccess, classroom }) {


  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const studentId = localStorage.getItem('userId');
  const user = useSelector((state) => state.user.userInfo); // ⬅️ Access userInfo from Redux

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    if (!studentId) {
      setError("Please ensure you are logged in.");
      setLoading(false);
      return;
    }

    if (!classroom || !classroom.entryCode) {
      setError("Classroom data is missing or incomplete. Please try again.");
      setLoading(false);
      return;
    }
  
    try {
      const token = localStorage.getItem('token'); // 🔐 Retrieve token from localStorage
  
      if (!token) {
        setError('No token found. Please log in again.');
        setLoading(false);
        return;
      }
  
      console.log("Joining with:", { classCode: classroom.entryCode, studentId, token });
  
      const response = await axios.post(
        'http://localhost:4000/api/classrooms/join',
        {
          classCode: classroom.entryCode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}` // ✅ Add token to Authorization header
          }
        }
      );
  
      if (response.data.success) {
        setError(response.data.message); // Display success message from server (e.g., "Already joined")
        onJoinSuccess(); // This should trigger re-fetch of joined classrooms
        onClose();
      }
    } catch (err) {
      console.error("Join error:", err);
      if (err.response) {
        setError(err.response.data?.message || 'Failed to join classroom');
      } else if (err.request) {
        setError('Network error: No response from server. Please check your internet connection or server status.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Confirm Join Classroom</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          You are about to join the classroom: <span className="font-bold">{classroom?.name}</span>.
        </p>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}