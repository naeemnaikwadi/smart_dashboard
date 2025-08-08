// Utility functions for handling authentication
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

export const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user?._id || user?.id || null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token') && !!getCurrentUser();
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
