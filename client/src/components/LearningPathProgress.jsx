import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  BookOpen,
  BarChart3,
  Download,
  Share2,
  Play,
  Pause,
  Calendar,
  Award,
  Users,
  FileText,
  X
} from 'lucide-react';

const LearningPathProgress = ({ learningPath, studentId, isInstructor = false }) => {
  const [progress, setProgress] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  useEffect(() => {
    loadProgress();
  }, [learningPath._id, studentId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      
      // Load learning path progress
      const token = localStorage.getItem('token');
      const progressResponse = await fetch(`http://localhost:4000/api/learning-paths/${learningPath._id}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgress(progressData);
      }

      // Load quiz results for this learning path
      const quizzesResponse = await fetch(`http://localhost:4000/api/quizzes/learning-path/${learningPath._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (quizzesResponse.ok) {
        const quizzes = await quizzesResponse.json();
        
        // For each quiz, get the student's attempts
        const quizResultsPromises = quizzes.map(async (quiz) => {
          const attemptsResponse = await fetch(`http://localhost:4000/api/quizzes/${quiz._id}/attempts`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (attemptsResponse.ok) {
            const attempts = await attemptsResponse.json();
            const studentAttempts = attempts.filter(attempt => 
              attempt.studentId === studentId || attempt.studentId === studentId
            );
            
            if (studentAttempts.length > 0) {
              // Get the best attempt
              const bestAttempt = studentAttempts.reduce((best, current) => 
                current.totalScore > best.totalScore ? current : best
              );
              
              return {
                quiz,
                attempt: bestAttempt,
                stepId: quiz.stepId
              };
            }
          }
          return null;
        });

        const results = (await Promise.all(quizResultsPromises)).filter(Boolean);
        setQuizResults(results);
      }

    } catch (err) {
      setError('Failed to load progress data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = () => {
    if (!progress || !learningPath.steps) return 0;
    
    const totalSteps = learningPath.steps.length;
    const completedSteps = progress.completedSteps?.length || 0;
    
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const calculateQuizProgress = () => {
    if (!quizResults || !learningPath.steps) return 0;
    
    const stepsWithQuizzes = learningPath.steps.filter(step => step.hasQuiz);
    const passedQuizzes = quizResults.filter(result => result.attempt.passed);
    
    if (stepsWithQuizzes.length === 0) return 100;
    
    return Math.round((passedQuizzes.length / stepsWithQuizzes.length) * 100);
  };

  const calculateOverallScore = () => {
    if (!quizResults || quizResults.length === 0) return 0;
    
    const totalScore = quizResults.reduce((sum, result) => sum + result.attempt.totalScore, 0);
    const maxScore = quizResults.reduce((sum, result) => sum + result.attempt.maxScore, 0);
    
    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  };

  const getStepStatus = (step) => {
    const isCompleted = progress?.completedSteps?.includes(step.order);
    const hasQuiz = step.hasQuiz;
    const quizResult = quizResults.find(result => result.stepId === step._id);
    
    if (hasQuiz && quizResult) {
      return quizResult.attempt.passed ? 'quiz_passed' : 'quiz_failed';
    } else if (isCompleted) {
      return 'completed';
    } else if (hasQuiz) {
      return 'quiz_required';
    } else {
      return 'pending';
    }
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'quiz_passed':
        return <Award className="w-5 h-5 text-green-600" />;
      case 'quiz_failed':
        return <Target className="w-5 h-5 text-red-600" />;
      case 'quiz_required':
        return <FileText className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
      case 'quiz_passed':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800';
      case 'quiz_failed':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'quiz_required':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600';
    }
  };

  const generateReport = () => {
    const overallProgress = calculateOverallProgress();
    const quizProgress = calculateQuizProgress();
    const overallScore = calculateOverallScore();
    
    const report = `
Learning Path Progress Report
============================

Learning Path: ${learningPath.title}
Student ID: ${studentId}
Generated: ${new Date().toLocaleDateString()}

OVERALL PROGRESS
----------------
Step Completion: ${overallProgress}%
Quiz Performance: ${quizProgress}%
Overall Score: ${overallScore}%

STEP-BY-STEP BREAKDOWN
----------------------
${learningPath.steps.map((step, index) => {
  const status = getStepStatus(step);
  const quizResult = quizResults.find(result => result.stepId === step._id);
  
  let stepInfo = `Step ${index + 1}: ${step.title}\n`;
  stepInfo += `Status: ${status}\n`;
  stepInfo += `Estimated Time: ${step.estimatedTime} minutes\n`;
  
  if (step.hasQuiz && quizResult) {
    stepInfo += `Quiz Score: ${quizResult.attempt.totalScore}/${quizResult.attempt.maxScore} (${quizResult.attempt.percentage}%)\n`;
    stepInfo += `Quiz Status: ${quizResult.attempt.passed ? 'PASSED' : 'FAILED'}\n`;
    stepInfo += `Attempts: ${quizResult.attempt.attemptNumber}\n`;
  }
  
  return stepInfo;
}).join('\n')}

QUIZ PERFORMANCE SUMMARY
------------------------
${quizResults.map((result, index) => {
  return `Quiz ${index + 1}: ${result.quiz.title}
Score: ${result.attempt.totalScore}/${result.attempt.maxScore} (${result.attempt.percentage}%)
Status: ${result.attempt.passed ? 'PASSED' : 'FAILED'}
Time Spent: ${Math.round(result.attempt.timeSpent / 60)} minutes
Attempts: ${result.attempt.attemptNumber}`;
}).join('\n\n')}

RECOMMENDATIONS
---------------
${overallProgress < 100 ? `• Complete remaining steps to improve overall progress\n` : ''}
${quizProgress < 100 ? `• Retake failed quizzes to improve quiz performance\n` : ''}
${overallScore < 70 ? `• Review quiz questions and study materials to improve scores\n` : ''}
• Continue practicing and reviewing completed materials
• Set specific goals for improvement in weaker areas
    `;

    return report;
  };

  const downloadReport = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-path-progress-${learningPath.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareReport = () => {
    const report = generateReport();
    if (navigator.share) {
      navigator.share({
        title: `Learning Path Progress: ${learningPath.title}`,
        text: report.substring(0, 200) + '...',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(report);
      alert('Progress report copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const quizProgress = calculateQuizProgress();
  const overallScore = calculateOverallScore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Learning Path Progress</h1>
              <p className="text-blue-100">{learningPath.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
            <button
              onClick={shareReport}
              className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6" />
              <div>
                <p className="text-blue-100 text-sm">Step Progress</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <div>
                <p className="text-purple-100 text-sm">Quiz Progress</p>
                <p className="text-2xl font-bold">{quizProgress}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-700/50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <p className="text-green-100 text-sm">Overall Score</p>
                <p className="text-2xl font-bold">{overallScore}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Progress Bars */}
        <div className="mb-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Step Completion</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quiz Performance</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{quizProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${quizProgress}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Score</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{overallScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${overallScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Progress */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Step-by-Step Progress
          </h3>
          
          <div className="space-y-3">
            {learningPath.steps.map((step, index) => {
              const status = getStepStatus(step);
              const quizResult = quizResults.find(result => result.stepId === step._id);
              
              return (
                <div
                  key={step._id}
                  className={`p-4 rounded-lg border ${getStepColor(status)} cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => setSelectedStep(step)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStepIcon(status)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Step {index + 1}: {step.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {step.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.estimatedTime} min
                          </span>
                          {step.hasQuiz && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Quiz Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {quizResult && (
                        <div className="text-sm">
                          <div className={`font-medium ${
                            quizResult.attempt.passed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {quizResult.attempt.totalScore}/{quizResult.attempt.maxScore}
                          </div>
                          <div className="text-gray-500">
                            {quizResult.attempt.percentage}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiz Performance Summary */}
        {quizResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Quiz Performance Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizResults.map((result, index) => (
                <div
                  key={result.quiz._id}
                  className={`p-4 rounded-lg border ${
                    result.attempt.passed
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                      : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Quiz {index + 1}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.attempt.passed
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {result.attempt.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {result.quiz.title}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Score:</span>
                      <span className="font-medium">
                        {result.attempt.totalScore}/{result.attempt.maxScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Percentage:</span>
                      <span className="font-medium">{result.attempt.percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Attempts:</span>
                      <span className="font-medium">{result.attempt.attemptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium">
                        {Math.round(result.attempt.timeSpent / 60)}m
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Recommendations
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            {overallProgress < 100 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                Complete remaining steps to improve overall progress
              </li>
            )}
            {quizProgress < 100 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                Retake failed quizzes to improve quiz performance
              </li>
            )}
            {overallScore < 70 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                Review quiz questions and study materials to improve scores
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              Continue practicing and reviewing completed materials
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              Set specific goals for improvement in weaker areas
            </li>
          </ul>
        </div>
      </div>

      {/* Step Detail Modal */}
      {selectedStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Step Details: {selectedStep.title}
              </h3>
              <button
                onClick={() => setSelectedStep(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-300">{selectedStep.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Estimated Time:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedStep.estimatedTime} minutes</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{getStepStatus(selectedStep)}</span>
                  </div>
                  {selectedStep.hasQuiz && (
                    <>
                      <div>
                        <span className="text-gray-500">Quiz Required:</span>
                        <span className="ml-2 text-green-600">Yes</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Passing Score:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">{selectedStep.quizPassingScore}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {selectedStep.resources && selectedStep.resources.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resources</h4>
                  <div className="space-y-2">
                    {selectedStep.resources.map((resource, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-900 dark:text-white">{resource.title}</span>
                        <span className="text-gray-400">({resource.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedStep.hasQuiz && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quiz Information</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    This step requires passing a quiz to be marked as complete. 
                    The quiz will test your understanding of the materials covered in this step.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathProgress;
