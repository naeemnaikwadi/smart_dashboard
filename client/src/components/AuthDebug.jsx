import React, { useState, useEffect } from 'react';

const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [authTest, setAuthTest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current authentication state
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    setDebugInfo({
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 20) + '...' : 'none',
      hasUser: !!user,
      userData: user ? JSON.parse(user) : null,
      timestamp: new Date().toISOString()
    });
  }, []);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth-test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setAuthTest(data);
    } catch (error) {
      setAuthTest({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testProtectedRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthTest({ ...data, status: 'success', statusCode: response.status });
      } else {
        const errorData = await response.json();
        setAuthTest({ ...errorData, status: 'error', statusCode: response.status });
      }
    } catch (error) {
      setAuthTest({ error: error.message, status: 'network_error' });
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
        🔐 Auth Debug
      </h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>Token:</strong> {debugInfo.hasToken ? '✅ Present' : '❌ Missing'}</div>
        <div><strong>User:</strong> {debugInfo.hasUser ? '✅ Present' : '❌ Missing'}</div>
        {debugInfo.userData && (
          <div><strong>Role:</strong> {debugInfo.userData.role}</div>
        )}
        <div><strong>Time:</strong> {debugInfo.timestamp}</div>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={testAuth}
          disabled={loading}
          className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Auth Endpoint
        </button>
        
        <button
          onClick={testProtectedRoute}
          disabled={loading}
          className="w-full px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Protected Route
        </button>
        
        <button
          onClick={clearAuth}
          className="w-full px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Clear Auth
        </button>
      </div>

      {authTest && (
        <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          <strong>Test Result:</strong>
          <pre className="mt-1 overflow-auto">
            {JSON.stringify(authTest, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;



