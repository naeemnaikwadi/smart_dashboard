import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  Submit,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Timer
} from 'lucide-react';

const QuizTaker = ({ quiz, onQuizCompleted, onCancel }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // Convert to seconds
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [error, setError] = useState('');
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startQuiz();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleTimeUp();
    }
  }, [timeLeft]);

  const startQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/quizzes/${quiz._id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start quiz');
      }

      const result = await response.json();
      setAttemptId(result.attemptId);
      
      // Start timer
      startTimer();
    } catch (err) {
      setError(err.message);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleTimeUp = () => {
    clearInterval(timerRef.current);
    setError('Time is up! Submitting quiz automatically...');
    setTimeout(() => {
      submitQuiz();
    }, 2000);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        timeSpent: Date.now() - startTimeRef.current
      }
    }));
  };

  const handleMultipleChoiceChange = (questionId, optionText, isChecked) => {
    const currentAnswer = answers[questionId]?.answer || [];
    let newAnswer;
    
    if (isChecked) {
      newAnswer = [...currentAnswer, optionText];
    } else {
      newAnswer = currentAnswer.filter(opt => opt !== optionText);
    }
    
    handleAnswerChange(questionId, newAnswer);
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < quiz.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    if (!attemptId) {
      setError('Quiz attempt not found');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/quizzes/${quiz._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          attemptId,
          answers: Object.entries(answers).map(([questionId, answerData]) => ({
            questionId,
            answer: answerData.answer,
            timeSpent: answerData.timeSpent || 0
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quiz');
      }

      const result = await response.json();
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      onQuizCompleted(result);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const getQuestionStatus = (index) => {
    const question = quiz.questions[index];
    const hasAnswer = answers[question._id];
    
    if (hasAnswer) {
      return 'answered';
    }
    return 'unanswered';
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <p className="text-blue-100">{quiz.description}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-blue-100 hover:text-white p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Timer and Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              <span className="text-lg font-mono font-bold">
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-blue-100">Progress</div>
            <div className="text-lg font-bold">
              {answeredCount} / {totalQuestions} answered
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="p-6">
        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round((answeredCount / totalQuestions) * 100)}% Complete
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : getQuestionStatus(index) === 'answered'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Question */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-medium rounded-full">
                {currentQuestion.type === 'mcq' ? 'Single Choice' : 
                 currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Long Answer'}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded-full">
                {currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {currentQuestion.question}
            </h3>

            {/* Question Options */}
            {currentQuestion.type === 'mcq' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name={`question_${currentQuestion._id}`}
                      value={option.text}
                      checked={answers[currentQuestion._id]?.answer === option.text}
                      onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-gray-900 dark:text-white">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'multiple_choice' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={answers[currentQuestion._id]?.answer?.includes(option.text) || false}
                      onChange={(e) => handleMultipleChoiceChange(currentQuestion._id, option.text, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-gray-900 dark:text-white">{option.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'long_answer' && (
              <div>
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Guidelines:</strong> {currentQuestion.longAnswerGuidelines}
                  </p>
                </div>
                <textarea
                  value={answers[currentQuestion._id]?.answer || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Type your answer here..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={answeredCount === 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Submit className="w-4 h-4" />
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Quiz Submission
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to submit your quiz? You cannot change your answers after submission.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={submitQuiz}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Submit className="w-4 h-4" />
                    Submit Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaker;
