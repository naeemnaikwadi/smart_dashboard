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
import QuizTaker from '../components/QuizTaker';
import QuizResults from '../components/QuizResults';
import QuizCreator from '../components/QuizCreator';
import QuizAttemptsModal from '../components/QuizAttemptsModal';
import { getCurrentUser } from '../utils/auth';

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
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [lastQuiz, setLastQuiz] = useState(null);
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showAttempts, setShowAttempts] = useState(false);
  const currentUser = getCurrentUser();
  const isInstructor = currentUser?.role === 'instructor';

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
        // Load quizzes for this learning path
        try {
          const token = localStorage.getItem('token');
          const quizResp = await fetch(`http://localhost:4000/api/quizzes/learning-path/${data._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (quizResp.ok) {
            const quizzes = await quizResp.json();
            setAvailableQuizzes(quizzes);
          }
        } catch (e) {}
        
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
      const step = learningPath.steps[currentStep];
      const stepQuiz = availableQuizzes.find(q => q.stepId === step._id);
      const passedPreviously = Array.isArray(userProgress?.quizResults)
        ? userProgress.quizResults.some(r => String(r.stepId) === String(step._id) && r.passed)
        : false;
      if (step?.hasQuiz && step?.quizRequired && stepQuiz && !((quizResults && quizResults.passed) || passedPreviously)) {
        setActiveQuiz(stepQuiz);
        return;
      }
      markStepComplete(currentStep);
      setCurrentStep(currentStep + 1);
      setQuizResults(null);
      setLastQuiz(null);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setQuizResults(null);
      setLastQuiz(null);
    }
  };

  const handleCompleteSession = async () => {
    try {
      // If final step has required quiz, enforce pass before completion
      const lastIndex = learningPath.steps.length - 1;
      const step = learningPath.steps[lastIndex];
      const stepQuiz = availableQuizzes.find(q => q.stepId === step?._id);
      const passedPreviously = Array.isArray(userProgress?.quizResults)
        ? userProgress.quizResults.some(r => String(r.stepId) === String(step._id) && r.passed)
        : false;
      if (step?.hasQuiz && step?.quizRequired && stepQuiz && !passedPreviously) {
        setActiveQuiz(stepQuiz);
        return;
      }

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

  const startStepQuiz = () => {
    const step = learningPath.steps[currentStep];
    const stepQuiz = availableQuizzes.find(q => q.stepId === step._id);
    if (stepQuiz) {
      setActiveQuiz(stepQuiz);
    }
  };

  const onQuizCompleted = (result) => {
    setQuizResults(result);
    setLastQuiz(activeQuiz);
    setActiveQuiz(null);
    // If passed, mark current step complete and refresh stored progress
    if (result?.passed) {
      markStepComplete(currentStep);
      // Also refresh user progress from server
      loadUserProgress(learningPath._id);
    }
  };

  const openQuizCreator = () => {
    const step = learningPath.steps[currentStep];
    const stepQuiz = availableQuizzes.find(q => q.stepId === step._id) || null;
    setEditingQuiz(stepQuiz);
    setShowQuizCreator(true);
  };

  const deleteStepQuiz = async () => {
    try {
      const step = learningPath.steps[currentStep];
      const stepQuiz = availableQuizzes.find(q => q.stepId === step?._id);
      if (!stepQuiz) return;
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:4000/api/quizzes/${stepQuiz._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        await refreshQuizzes();
      }
    } catch (e) {}
  };

  const refreshQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const quizResp = await fetch(`http://localhost:4000/api/quizzes/learning-path/${learningPath._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (quizResp.ok) {
        const quizzes = await quizResp.json();
        setAvailableQuizzes(quizzes);
      }
    } catch (e) {}
  };

  const viewMaterials = (resources) => {
    const documents = resources.filter(resource => resource.uploadedFile || resource.cloudinaryUrl).map(resource => ({
      filename: resource.uploadedFile || resource.cloudinaryUrl,
      originalName: resource.title,
      url: resource.cloudinaryUrl || resource.uploadedFile,
      path: resource.cloudinaryUrl || resource.uploadedFile,
      cloudinaryUrl: resource.cloudinaryUrl || resource.uploadedFile,
      type: resource.type,
      size: resource.fileSize || 0,
      mimetype: resource.type || 'application/octet-stream',
      fileType: resource.type || 'application/octet-stream',
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
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
      <DashboardLayout>
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
    <DashboardLayout>
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
            {learningPath.steps.map((step, index) => {
              const canAccess = index === 0 || completedSteps.has(index - 1) || completedSteps.has(index);
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (canAccess) setCurrentStep(index);
                  }}
                  disabled={!canAccess}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : canAccess
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Target className="w-4 h-4" />
                  )}
                  <span>Step {index + 1}</span>
                </button>
              );
            })}
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

            <div className="flex items-center gap-2">
              {(() => {
                const step = learningPath.steps[currentStep];
                const isLast = currentStep === (learningPath.steps.length - 1);
                const stepQuiz = availableQuizzes.find(q => q.stepId === step?._id);
                return (
                  <div className="flex items-center gap-2">
                    {isInstructor && (
                      <button
                        onClick={openQuizCreator}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                      >
                        {stepQuiz ? (isLast ? 'Edit Final Quiz' : 'Edit Quiz') : (isLast ? 'Create Final Quiz' : 'Create Quiz')}
                      </button>
                    )}
                    {isInstructor && stepQuiz && (
                      <button
                        onClick={() => setShowAttempts(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        View Attempts
                      </button>
                    )}
                    {isInstructor && stepQuiz && (
                      <button
                        onClick={deleteStepQuiz}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Delete Quiz
                      </button>
                    )}
                    {step?.hasQuiz && stepQuiz && (
                      <button
                        onClick={startStepQuiz}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        {isLast ? 'Take Final Quiz' : 'Take Step Quiz'}
                      </button>
                    )}
                    {(!stepQuiz && step?.quizRequired && !isInstructor) && (
                      <span className="text-sm text-red-600">Quiz not available yet</span>
                    )}
                  </div>
                );
              })()}

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

      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-5xl relative max-h-[90vh] overflow-y-auto p-4">
            <QuizTaker
              quiz={activeQuiz}
              onQuizCompleted={onQuizCompleted}
              onCancel={() => setActiveQuiz(null)}
            />
          </div>
        </div>
      )}

      {quizResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto p-4">
            <QuizResults
              results={quizResults}
              quiz={lastQuiz || { title: 'Step Quiz', questions: [] }}
              onClose={() => setQuizResults(null)}
            />
          </div>
        </div>
      )}

      {showQuizCreator && isInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto p-4">
            <QuizCreator
              learningPathId={learningPath._id}
              stepId={learningPath.steps[currentStep]._id}
              existingQuiz={editingQuiz}
              onCancel={() => setShowQuizCreator(false)}
              onQuizCreated={async () => {
                setShowQuizCreator(false);
                await refreshQuizzes();
              }}
            />
          </div>
        </div>
      )}

      {showAttempts && isInstructor && (() => {
        const step = learningPath.steps[currentStep];
        const stepQuiz = availableQuizzes.find(q => q.stepId === step?._id);
        if (!stepQuiz) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <QuizAttemptsModal quizId={stepQuiz._id} onClose={() => setShowAttempts(false)} />
          </div>
        );
      })()}

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
