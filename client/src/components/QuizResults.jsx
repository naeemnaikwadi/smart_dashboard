import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  BookOpen,
  Eye,
  EyeOff,
  Download,
  Share2
} from 'lucide-react';

const QuizResults = ({ results, quiz, onClose, isInstructor = false }) => {
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(isInstructor);

  const {
    score,
    maxScore,
    percentage,
    passed,
    feedback,
    timeSpent,
    answers
  } = results;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (percentage >= 80) return 'bg-blue-100 dark:bg-blue-900/20';
    if (percentage >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return 'Excellent! Outstanding performance!';
    if (percentage >= 80) return 'Great job! Well done!';
    if (percentage >= 70) return 'Good work! You passed!';
    if (percentage >= 60) return 'Almost there! Keep practicing!';
    return 'Keep studying and try again!';
  };

  const downloadResults = () => {
    const resultsText = `
Quiz Results: ${quiz.title}
Score: ${score}/${maxScore} (${percentage}%)
Status: ${passed ? 'PASSED' : 'FAILED'}
Time Spent: ${formatTime(timeSpent)}
Performance: ${getPerformanceMessage(percentage)}

Detailed Results:
${answers.map((answer, index) => {
  const question = quiz.questions.find(q => q._id === answer.questionId);
  return `
Question ${index + 1}: ${question?.question}
Your Answer: ${Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}
Correct: ${answer.isCorrect ? 'Yes' : 'No'}
Points Earned: ${answer.pointsEarned}/${question?.points || 1}
Feedback: ${answer.feedback}
`;
}).join('\n')}
    `;

    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${quiz.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: `Quiz Results: ${quiz.title}`,
        text: `I scored ${score}/${maxScore} (${percentage}%) on ${quiz.title}!`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Quiz Results: ${quiz.title} - Score: ${score}/${maxScore} (${percentage}%)`
      );
      alert('Results copied to clipboard!');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Quiz Results</h1>
              <p className="text-blue-100">{quiz.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Score Card */}
          <div className={`p-4 rounded-lg border ${getScoreBgColor(percentage)} border-gray-200 dark:border-gray-600`}>
            <div className="flex items-center gap-3">
              <Target className={`w-6 h-6 ${getScoreColor(percentage)}`} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                  {score}/{maxScore}
                </p>
              </div>
            </div>
          </div>

          {/* Percentage Card */}
          <div className={`p-4 rounded-lg border ${getScoreBgColor(percentage)} border-gray-200 dark:border-gray-600`}>
            <div className="flex items-center gap-3">
              <TrendingUp className={`w-6 h-6 ${getScoreColor(percentage)}`} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Percentage</p>
                <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                  {percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className={`p-4 rounded-lg border ${passed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} border-gray-200 dark:border-gray-600`}>
            <div className="flex items-center gap-3">
              {passed ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className={`text-2xl font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {passed ? 'PASSED' : 'FAILED'}
                </p>
              </div>
            </div>
          </div>

          {/* Time Card */}
          <div className="p-4 rounded-lg border bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(timeSpent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Message */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Performance Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {getPerformanceMessage(percentage)}
          </p>
          {feedback && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Feedback:</strong> {feedback}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDetailedResults(!showDetailedResults)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showDetailedResults ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showDetailedResults ? 'Hide Details' : 'Show Details'}
            </button>
            
            {isInstructor && (
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAnswers ? 'Hide Answers' : 'Show Answers'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadResults}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={shareResults}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Detailed Results */}
        {showDetailedResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Question-by-Question Results
            </h3>
            
            {answers.map((answer, index) => {
              const question = quiz.questions.find(q => q._id === answer.questionId);
              if (!question) return null;

              return (
                <div
                  key={answer.questionId}
                  className={`p-4 rounded-lg border ${
                    answer.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Q{index + 1}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        answer.isCorrect
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {answer.pointsEarned}/{question.points} pts
                      </span>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {question.question}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Your Answer:</strong>
                      </p>
                      <p className="text-gray-900 dark:text-white">
                        {Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer || 'No answer provided'}
                      </p>
                    </div>

                    {showAnswers && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Correct Answer:</strong>
                        </p>
                        {question.type === 'mcq' && (
                          <p className="text-green-700 dark:text-green-300 font-medium">
                            {question.correctAnswer}
                          </p>
                        )}
                        {question.type === 'multiple_choice' && (
                          <div className="space-y-1">
                            {question.options.filter(opt => opt.isCorrect).map((opt, optIndex) => (
                              <p key={optIndex} className="text-green-700 dark:text-green-300 font-medium">
                                • {opt.text}
                              </p>
                            ))}
                          </div>
                        )}
                        {question.type === 'long_answer' && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {question.longAnswerGuidelines}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {answer.feedback && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Feedback:</strong> {answer.feedback}
                      </p>
                    </div>
                  )}

                  {question.explanation && showAnswers && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Next Steps
          </h3>
          {passed ? (
            <p className="text-blue-800 dark:text-blue-200">
              Congratulations! You've successfully completed this quiz. You can now proceed to the next step in your learning path.
            </p>
          ) : (
            <p className="text-blue-800 dark:text-blue-200">
              Don't worry! Review the questions you got wrong and try again. Learning is a process, and every attempt helps you improve.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
