import axios from 'axios';

const API = 'http://localhost:4000/api/learning-paths';

// Create a new learning path
export const createLearningPath = async (data) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(API, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creating learning path:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to create learning path' 
    };
  }
};

// Fetch all learning paths
export const fetchAllLearningPaths = async () => {
  const token = localStorage.getItem('token');
  return axios.get(API, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Fetch learning paths by instructor
export const fetchLearningPathsByInstructor = async (instructorId) => {
  const token = localStorage.getItem('token');
  return axios.get(`${API}/instructor/${instructorId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Update progress for a learning path
export const updateProgress = async (data) => {
  const token = localStorage.getItem('token');
  return axios.put(`${API}/${data.learningPathId || data.pathId}/update-progress`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Get progress for a learning path
export const getProgress = async (pathId) => {
  const token = localStorage.getItem('token');
  return axios.get(`${API}/${pathId}/progress`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

// Start a learning session
export const startLearningSession = async (pathId, data) => {
  const token = localStorage.getItem('token');
  return axios.post(`${API}/${pathId}/start-session`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// End a learning session
export const endLearningSession = async (pathId, data) => {
  const token = localStorage.getItem('token');
  return axios.put(`${API}/${pathId}/end-session`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
