import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, BookOpen, Clock, CheckCircle, ArrowLeft, Timer } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const LearningSession = () => {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentResource, setCurrentResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    loadSession();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathId]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isActive]);

  const loadSession = async () => {
    try {
      setLoading(true);
      // Load learning path details
      const pathResponse = await fetch(`http://localhost:4000/api/learning-paths/${pathId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (pathResponse.ok) {
        const pathData = await pathResponse.json();
        setSession(pathData);
        setCurrentResource(pathData.resources?.[0] || null);
      }

      // Load existing progress
      const progressResponse = await fetch(`http://localhost:4000/api/learning-paths/${pathId}/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgress(progressData.overallProgress || 0);
        setElapsedTime(progressData.timeSpent || 0);
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load learning session');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/learning-paths/${pathId}/start-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          topic: session?.title || 'Learning Session',
          resourceId: currentResource?._id || pathId
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSession(prev => ({ ...prev, sessionId: result.sessionId }));
        setIsActive(true);
        setStartTime(new Date());
      }
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start learning session');
    }
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const resumeSession = () => {
    setIsActive(true);
  };

  const endSession = async () => {
    try {
      if (session?.sessionId) {
        const duration = Math.floor(elapsedTime / 60); // Convert to minutes
        const response = await fetch(`http://localhost:4000/api/learning-paths/${pathId}/end-session`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            sessionId: session.sessionId,
            duration: duration,
            pagesRead: Math.floor(progress / 10), // Estimate pages read
            completionPercentage: progress
          })
        });

        if (response.ok) {
          const result = await response.json();
          setProgress(result.progress || progress);
        }
      }
      
      setIsActive(false);
      navigate('/learning-paths');
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end learning session');
    }
  };

  const updateProgress = (newProgress) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading learning session...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/learning-paths')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Learning Paths
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <Timer className="w-4 h-4" />
              <span className="font-mono">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>{progress}% Complete</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Session Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {session?.title || 'Learning Session'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {session?.description || 'Continue your learning journey'}
          </p>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Session Controls */}
          <div className="flex gap-4">
            {!isActive && !startTime && (
              <button
                onClick={startSession}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Learning
              </button>
            )}
            
            {isActive && (
              <button
                onClick={pauseSession}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            
            {!isActive && startTime && (
              <button
                onClick={resumeSession}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
            
            {startTime && (
              <button
                onClick={endSession}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                End Session
              </button>
            )}
          </div>
        </div>

        {/* Current Resource */}
        {currentResource && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Current Resource: {currentResource.title}
            </h2>
            
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-300">
                {currentResource.description || 'No description available'}
              </p>
            </div>

            {currentResource.type === 'link' && currentResource.link && (
              <div className="mb-4">
                <a
                  href={currentResource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Open Resource
                </a>
              </div>
            )}

            {currentResource.type === 'document' && currentResource.uploadedFile && (
              <div className="mb-4">
                <a
                  href={`http://localhost:4000/uploads/${currentResource.uploadedFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  View Document
                </a>
              </div>
            )}
          </div>
        )}

        {/* Progress Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Update Progress
          </h3>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => updateProgress(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[60px]">
              {progress}%
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LearningSession;
