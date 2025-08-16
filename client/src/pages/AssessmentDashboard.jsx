import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  BookOpen,
  BarChart3,
  Calendar,
  Star,
  Eye,
  ArrowRight,
  RefreshCw,
  Play
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const AssessmentDashboard = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalAssessments: 0,
    completedAssessments: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    improvementRate: 0
  });

  useEffect(() => {
    loadAssessmentData();
  }, []);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load learning paths and their progress
      const response = await fetch('http://localhost:4000/api/learning-paths', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const learningPaths = await response.json();
        
        // Load progress for each learning path
        const assessmentData = await Promise.all(
          learningPaths.map(async (path) => {
            try {
              const progressResponse = await fetch(`http://localhost:4000/api/learning-paths/${path._id}/progress`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });

              if (progressResponse.ok) {
                const progress = await progressResponse.json();
                return {
                  ...path,
                  progress,
                  assessmentCompleted: progress.assessmentCompleted || false,
                  assessmentScore: progress.assessmentScore || 0,
                  timeSpent: progress.timeSpent || 0,
                  completedAt: progress.completedAt || null
                };
              }
              return path;
            } catch (error) {
              console.error(`Error loading progress for path ${path._id}:`, error);
              return path;
            }
          })
        );

        setAssessments(assessmentData);
        calculateStats(assessmentData);
      } else {
        setError('Failed to load assessment data');
      }
    } catch (error) {
      console.error('Error loading assessment data:', error);
      setError('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const completed = data.filter(item => item.assessmentCompleted);
    const totalTime = data.reduce((sum, item) => sum + (item.timeSpent || 0), 0);
    const avgScore = completed.length > 0 
      ? completed.reduce((sum, item) => sum + (item.assessmentScore || 0), 0) / completed.length 
      : 0;

    setStats({
      totalAssessments: data.length,
      completedAssessments: completed.length,
      averageScore: Math.round(avgScore),
      totalTimeSpent: totalTime,
      improvementRate: completed.length > 0 ? Math.round((completed.length / data.length) * 100) : 0
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remainingMins}m` : `${mins}m`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const handleRetakeAssessment = (learningPath) => {
    navigate(`/learning-session/${learningPath._id}`);
  };

  const handleViewDetails = (learningPath) => {
    navigate(`/learning-paths`);
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

  return (
    <DashboardLayout role="student">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Award className="w-8 h-8 text-purple-600" />
                Assessment Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Track your learning progress and assessment results
              </p>
            </div>
            <button
              onClick={loadAssessmentData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAssessments}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedAssessments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageScore}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
                <p className="text-2xl font-bold text-orange-600">{formatTime(stats.totalTimeSpent)}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.improvementRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Assessment List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Learning Path Assessments
            </h2>
          </div>

          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Assessments Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start learning from learning paths to take assessments.
              </p>
              <button
                onClick={() => navigate('/learning-paths')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
              >
                <BookOpen className="w-4 h-4" />
                Explore Learning Paths
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {assessments.map((assessment) => (
                <div key={assessment._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {assessment.title}
                        </h3>
                        {assessment.assessmentCompleted && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(assessment.assessmentScore)}`}>
                            {getScoreLabel(assessment.assessmentScore)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {assessment.description}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{assessment.steps?.length || 0} steps</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(assessment.timeSpent)}</span>
                        </div>
                        {assessment.completedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(assessment.completedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {assessment.progress && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{assessment.progress.overallProgress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${assessment.progress.overallProgress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Assessment Score */}
                      {assessment.assessmentCompleted && (
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Assessment Score: {assessment.assessmentScore}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {assessment.assessmentCompleted ? (
                        <button
                          onClick={() => handleRetakeAssessment(assessment)}
                          className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retake
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRetakeAssessment(assessment)}
                          className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Learning
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleViewDetails(assessment)}
                        className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Insights */}
        {stats.completedAssessments > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Performance Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Learning Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate</span>
                    <span className="font-medium">{Math.round((stats.completedAssessments / stats.totalAssessments) * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Score</span>
                    <span className="font-medium">{stats.averageScore}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Study Time</span>
                    <span className="font-medium">{formatTime(stats.totalTimeSpent)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Recommendations</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {stats.averageScore >= 80 ? (
                    <p>🎉 Excellent performance! Consider exploring advanced topics.</p>
                  ) : stats.averageScore >= 60 ? (
                    <p>👍 Good progress! Focus on areas with lower scores.</p>
                  ) : (
                    <p>📚 Keep practicing! Review completed materials for better understanding.</p>
                  )}
                  
                  {stats.completedAssessments < stats.totalAssessments && (
                    <p>🚀 Complete more assessments to improve your overall score.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssessmentDashboard;
