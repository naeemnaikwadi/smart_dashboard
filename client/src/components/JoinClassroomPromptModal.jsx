import React, { useState } from 'react';
import axios from 'axios';

export default function JoinClassroomPromptModal({ isOpen, onClose, onClassroomFound }) {
  const [entryCode, setEntryCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFindClassroom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!entryCode) {
      setError('Please enter a classroom code.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:4000/api/classrooms/find-by-code/${entryCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        onClassroomFound(response.data);
        onClose(); // Close this modal after finding the classroom
      } else {
        setError('Classroom not found. Please check the code and try again.');
      }
    } catch (err) {
      console.error('Error finding classroom:', err);
      setError(err.response?.data?.message || 'Failed to find classroom.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Join Classroom</h2>
        <form onSubmit={handleFindClassroom}>
          <div className="mb-4">
            <label htmlFor="entryCode" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Classroom Entry Code:
            </label>
            <input
              type="text"
              id="entryCode"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={entryCode}
              onChange={(e) => setEntryCode(e.target.value)}
              placeholder="Enter code"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
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
              {loading ? 'Finding...' : 'Find Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}