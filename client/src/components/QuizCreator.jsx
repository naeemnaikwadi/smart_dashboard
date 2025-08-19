import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  CheckCircle, 
  X,
  AlertCircle,
  Clock,
  Target,
  BookOpen
} from 'lucide-react';

const QuizCreator = ({ 
  learningPathId, 
  stepId, 
  onQuizCreated, 
  onCancel,
  existingQuiz = null 
}) => {
  const [quizData, setQuizData] = useState({
    title: existingQuiz?.title || '',
    description: existingQuiz?.description || '',
    timeLimit: existingQuiz?.timeLimit || 30,
    passingScore: existingQuiz?.passingScore || 70,
    allowRetakes: existingQuiz?.allowRetakes !== false,
    maxAttempts: existingQuiz?.maxAttempts || 3
  });

  const [questions, setQuestions] = useState(existingQuiz?.questions || []);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: 'mcq',
    options: [{ text: '', isCorrect: false }],
    correctAnswer: '',
    longAnswerGuidelines: '',
    // numerical
    numericAnswer: '',
    numericTolerance: 0,
    // assignment
    requiresUpload: false,
    points: 1,
    difficulty: 'medium',
    explanation: ''
  });

  const [questionFile, setQuestionFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const questionTypes = [
    { value: 'mcq', label: 'Multiple Choice (Single Answer)', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'multiple_choice', label: 'Multiple Choice (Multiple Answers)', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'numerical', label: 'Numerical Value', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'assignment', label: 'Upload Assignment', icon: <Upload className="w-4 h-4" /> },
    { value: 'long_answer', label: 'Long Answer/Essay', icon: <FileText className="w-4 h-4" /> }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'hard', label: 'Hard', color: 'text-red-600' }
  ];

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.type === 'mcq' || currentQuestion.type === 'multiple_choice') {
      if (currentQuestion.options.length < 2) {
        setError('At least 2 options are required');
        return;
      }
      if (!currentQuestion.options.some(opt => opt.isCorrect)) {
        setError('At least one option must be marked as correct');
        return;
      }
      if (currentQuestion.type === 'mcq' && currentQuestion.options.filter(opt => opt.isCorrect).length > 1) {
        setError('MCQ can only have one correct answer');
        return;
      }
    }

    if (currentQuestion.type === 'long_answer' && !currentQuestion.longAnswerGuidelines.trim()) {
      setError('Guidelines are required for long answer questions');
      return;
    }

    if (currentQuestion.type === 'numerical') {
      const val = Number(currentQuestion.numericAnswer);
      if (Number.isNaN(val)) {
        setError('Provide a numeric correct answer');
        return;
      }
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now().toString()
    };

    setQuestions([...questions, newQuestion]);
    resetCurrentQuestion();
    setError('');
  };

  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      question: '',
      type: 'mcq',
      options: [{ text: '', isCorrect: false }],
      correctAnswer: '',
      longAnswerGuidelines: '',
      numericAnswer: '',
      numericTolerance: 0,
      requiresUpload: false,
      points: 1,
      difficulty: 'medium',
      explanation: ''
    });
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: '', isCorrect: false }]
    });
  };

  const removeOption = (index) => {
    const updatedOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };

  const updateOption = (index, field, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setQuestionFile(file);
      // Here you could add file parsing logic for different formats
      // For now, we'll just store the file reference
    }
  };

  const handleSubmit = async () => {
    if (!quizData.title.trim()) {
      setError('Quiz title is required');
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', quizData.title);
      formData.append('description', quizData.description);
      formData.append('learningPathId', learningPathId);
      formData.append('stepId', stepId);
      formData.append('timeLimit', quizData.timeLimit);
      formData.append('passingScore', quizData.passingScore);
      formData.append('allowRetakes', quizData.allowRetakes);
      formData.append('maxAttempts', quizData.maxAttempts);
      formData.append('questions', JSON.stringify(questions));

      if (questionFile) {
        formData.append('questionFile', questionFile);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/quizzes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quiz');
      }

      const result = await response.json();
      setSuccess('Quiz created successfully!');
      setTimeout(() => {
        onQuizCreated(result);
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const updateQuiz = async () => {
    if (!existingQuiz) return;

    setIsUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/quizzes/${existingQuiz._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...quizData,
          questions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quiz');
      }

      const result = await response.json();
      setSuccess('Quiz updated successfully!');
      setTimeout(() => {
        onQuizCreated(result);
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {existingQuiz ? 'Edit Quiz' : 'Create Quiz'}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Quiz Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quiz Title *
          </label>
          <input
            type="text"
            value={quizData.title}
            onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter quiz title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            value={quizData.timeLimit}
            onChange={(e) => setQuizData({ ...quizData, timeLimit: parseInt(e.target.value) || 30 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            min="5"
            max="180"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passing Score (%)
          </label>
          <input
            type="number"
            value={quizData.passingScore}
            onChange={(e) => setQuizData({ ...quizData, passingScore: parseInt(e.target.value) || 70 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Attempts
          </label>
          <input
            type="number"
            value={quizData.maxAttempts}
            onChange={(e) => setQuizData({ ...quizData, maxAttempts: parseInt(e.target.value) || 3 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            min="1"
            max="10"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={quizData.description}
          onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter quiz description"
        />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <input
          type="checkbox"
          id="allowRetakes"
          checked={quizData.allowRetakes}
          onChange={(e) => setQuizData({ ...quizData, allowRetakes: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="allowRetakes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Allow students to retake this quiz
        </label>
      </div>

      {/* File Upload Section */}
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Questions File (Optional)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Upload a file with questions (CSV, Excel, or text format). You can also create questions manually below.
        </p>
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".csv,.xlsx,.xls,.txt,.doc,.docx,.pdf,.zip"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
        />
      </div>

      {/* Questions Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Questions ({questions.length})
        </h3>

        {/* Current Question Form */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add New Question</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Type
              </label>
              <select
                value={currentQuestion.type}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={currentQuestion.difficulty}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Text *
            </label>
            <textarea
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your question here"
            />
          </div>

          {/* Options for MCQ/Multiple Choice */}
          {(currentQuestion.type === 'mcq' || currentQuestion.type === 'multiple_choice') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options *
              </label>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={`Option ${index + 1}`}
                  />
                  {currentQuestion.options.length > 1 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addOption}
                className="mt-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Option
              </button>
            </div>
          )}

          {/* Numerical Settings */}
          {currentQuestion.type === 'numerical' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correct Numerical Answer *
                </label>
                <input
                  type="number"
                  value={currentQuestion.numericAnswer}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, numericAnswer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., 3.14"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tolerance (±)
                </label>
                <input
                  type="number"
                  value={currentQuestion.numericTolerance}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, numericTolerance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  step="0.0001"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Assignment Settings */}
          {currentQuestion.type === 'assignment' && (
            <div className="mb-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={currentQuestion.requiresUpload}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, requiresUpload: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                Require student file upload
              </label>
            </div>
          )}

          {/* Guidelines for Long Answer */}
          {currentQuestion.type === 'long_answer' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Answer Guidelines *
              </label>
              <textarea
                value={currentQuestion.longAnswerGuidelines}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, longAnswerGuidelines: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Provide guidelines for students on how to answer this question"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points
              </label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Explanation (Optional)
              </label>
              <input
                type="text"
                value={currentQuestion.explanation}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Explanation of the correct answer"
              />
            </div>
          </div>

          <button
            onClick={addQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        {/* Existing Questions List */}
        {questions.length > 0 && (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div key={question.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Q{index + 1}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {question.difficulty}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {question.points} pt{question.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-gray-900 dark:text-white mb-2">{question.question}</p>
                
                {question.type === 'long_answer' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Guidelines:</strong> {question.longAnswerGuidelines}
                  </p>
                )}

                {(question.type === 'mcq' || question.type === 'multiple_choice') && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Options:</strong>
                    <ul className="mt-1 space-y-1">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex} className={`flex items-center gap-2 ${
                          option.isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : ''
                        }`}>
                          {option.isCorrect && <CheckCircle className="w-4 h-4" />}
                          {option.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.type === 'numerical' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Answer:</strong> {question.numericAnswer} (± {question.numericTolerance || 0})
                  </div>
                )}

                {question.type === 'assignment' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Requires upload:</strong> {question.requiresUpload ? 'Yes' : 'No'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={existingQuiz ? updateQuiz : handleSubmit}
          disabled={isUploading || questions.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {existingQuiz ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {existingQuiz ? 'Update Quiz' : 'Create Quiz'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuizCreator;
