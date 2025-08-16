import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Play, 
  Pause, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  FileText,
  Video,
  Link,
  Target,
  Award,
  Eye,
  Download
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DocumentViewer from '../components/DocumentViewer';
import StepWiseAssessment from '../components/StepWiseAssessment';

const LearningSession = () => {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const [learningPath, setLearningPath] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showAssessment, setShowAssessment] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [completedSteps, setCompletedSteps] = useState(new Set());

  useEffect(() => {
    loadLearningPath();
    setSessionStartTime(Date.now());
    
    // Timer for session duration
    const timer = setInterval(() => {
      if (sessionStartTime) {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pathId]);

  const loadLearningPath = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/learning-paths/${pathId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLearningPath(data);
        
        // Load user progress
        await loadUserProgress(data._id);
      } else {
        setError('Failed to load learning path');
      }
    } catch (error) {
      console.error('Error loading learning path:', error);
      setError('Failed to load learning path');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async (pathId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/learning-paths/${pathId}/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const progress = await response.json();
        setUserProgress(progress);
        
        // Mark completed steps
        if (progress.completedSteps) {
          setCompletedSteps(new Set(progress.completedSteps));
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const markStepComplete = async (stepIndex) => {
    try {
      const newCompletedSteps = new Set(completedSteps);
      newCompletedSteps.add(stepIndex);
      setCompletedSteps(newCompletedSteps);

      // Update progress on server
      const progressData = {
        learningPathId: pathId,
        completedSteps: Array.from(newCompletedSteps),
        timeSpent: sessionDuration,
        currentStep: stepIndex
      };

      const response = await fetch(`http://localhost:4000/api/learning-paths/${pathId}/update-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(progressData)
      });

      if (response.ok) {
        const updatedProgress = await response.json();
        setUserProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleNextStep = () => {
    if (currentStep < learningPath.steps.length - 1) {
      markStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteSession = async () => {
    try {
      // Mark final step as complete
      markStepComplete(currentStep);

      // End session
      const response = await fetch(`http://localhost:4000/api/learning-paths/${pathId}/end-session`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId: sessionStartTime,
          duration: sessionDuration,
          completionPercentage: ((completedSteps.size + 1) / learningPath.steps.length) * 100
        })
      });

      if (response.ok) {
        // Show assessment
        setShowAssessment(true);
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleAssessmentComplete = async (results) => {
    try {
      // Update final progress
      const finalProgress = {
        learningPathId: pathId,
        assessmentCompleted: true,
        assessmentScore: results.score || 0,
        timeSpent: sessionDuration,
        completedAt: new Date()
      };

      await fetch(`http://localhost:4000/api/learning-paths/${pathId}/update-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(finalProgress)
      });

      // Navigate back to learning paths
      navigate('/learning-paths');
    } catch (error) {
      console.error('Error saving assessment results:', error);
    }
  };

  const viewMaterials = (resources) => {
    const documents = resources.filter(resource => resource.uploadedFile).map(resource => ({
      filename: resource.uploadedFile,
      originalName: resource.title,
      type: resource.type,
      size: resource.fileSize || 0,
      uploadedAt: new Date()
    }));
    
    if (documents.length > 0) {
      setSelectedDocuments(documents);
      setShowDocumentViewer(true);
    } else {
      alert('No uploaded materials available for this step.');
    }
  };

  const getResourceIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'link':
        return <Link className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="student">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/learning-paths')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Learning Paths
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!learningPath) {
    return (
      <DashboardLayout role="student">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Learning path not found</div>
          <button
            onClick={() => navigate('/learning-paths')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Learning Paths
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const currentStepData = learningPath.steps[currentStep];
  const progress = (completedSteps.size / learningPath.steps.length) * 100;

  return (
    <DashboardLayout role="student">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/learning-paths')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Learning Paths
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {learningPath.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {learningPath.description}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{formatTime(sessionDuration)}</div>
              <div className="text-sm text-gray-500">Session Time</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress: {Math.round(progress)}%</span>
            <span>Step {currentStep + 1} of {learningPath.steps.length}</span>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {learningPath.steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600 text-white'
                    : completedSteps.has(index)
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {completedSteps.has(index) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                <span>Step {index + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {currentStepData.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{currentStepData.estimatedTime || 30} min</span>
            </div>
          </div>

          {/* Resources */}
          {currentStepData.resources && currentStepData.resources.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Learning Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentStepData.resources.map((resource, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getResourceIcon(resource.type)}
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {resource.title}
                      </h4>
                    </div>
                    
                    {resource.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {resource.description}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {resource.uploadedFile && (
                        <button
                          onClick={() => viewMaterials([resource])}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      )}
                      
                      {resource.type === 'link' && resource.link && (
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Link className="w-4 h-4" />
                          Open Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep === learningPath.steps.length - 1 ? (
              <button
                onClick={handleCompleteSession}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Complete Learning Path
                <Award className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{completedSteps.size}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Steps Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatTime(sessionDuration)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{Math.round(progress)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewer && (
        <DocumentViewer
          documents={selectedDocuments}
          onClose={() => {
            setShowDocumentViewer(false);
            setSelectedDocuments([]);
          }}
        />
      )}

      {/* Assessment Modal */}
      {showAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-6xl relative max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Assessment: {learningPath.title}
                </h2>
                <button
                  onClick={() => setShowAssessment(false)}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <StepWiseAssessment
              learningPath={learningPath}
              onComplete={handleAssessmentComplete}
              userProgress={userProgress}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LearningSession;
