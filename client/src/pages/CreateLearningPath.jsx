import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Trash2, Upload, FileText, Video, Link, Image, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const CreateLearningPath = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [steps, setSteps] = useState([]);
  const [addFinalTest, setAddFinalTest] = useState(false);
  const [activeQuizEditor, setActiveQuizEditor] = useState(null);

  // Check if we have course context from navigation
  const courseContext = location.state?.selectedCourse;

  useEffect(() => {
    fetchCourses();
    
    // Pre-select course if coming from a specific course
    if (courseContext) {
      setSelectedCourse(courseContext);
    }
  }, [courseContext]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/instructor/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    }
  };

  const addStep = () => {
    const newStep = {
      id: Date.now(),
      title: '',
      description: '',
      order: steps.length + 1,
      estimatedTime: 30,
      resources: [],
      quizRequired: false
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId) => {
    setSteps(steps.filter(step => step.id !== stepId));
    // Reorder remaining steps
    setSteps(prev => prev.map((step, index) => ({ ...step, order: index + 1 })));
  };

  const updateStep = (stepId, field, value) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };

  // Quiz builder helpers (store draft in each step)
  const ensureQuizDraft = (step) => ({
    title: step.quizDraft?.title || `${step.title || 'Step'} Quiz`,
    description: step.quizDraft?.description || '',
    timeLimit: step.quizDraft?.timeLimit || 30,
    passingScore: step.quizDraft?.passingScore || 70,
    allowRetakes: step.quizDraft?.allowRetakes !== false,
    maxAttempts: step.quizDraft?.maxAttempts || 3,
    questions: step.quizDraft?.questions || []
  });

  const toggleQuizEditor = (stepId) => {
    setActiveQuizEditor(prev => prev === stepId ? null : stepId);
    setSteps(prev => prev.map(step => step.id === stepId ? { ...step, quizDraft: ensureQuizDraft(step) } : step));
  };

  const updateQuizMeta = (stepId, field, value) => {
    setSteps(prev => prev.map(step => step.id === stepId ? {
      ...step,
      quizDraft: { ...ensureQuizDraft(step), [field]: value }
    } : step));
  };

  const addQuizQuestion = (stepId) => {
    setSteps(prev => prev.map(step => {
      if (step.id !== stepId) return step;
      const draft = ensureQuizDraft(step);
      const newQuestion = {
        id: Date.now().toString(),
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
      };
      return { ...step, quizDraft: { ...draft, questions: [...draft.questions, newQuestion] } };
    }));
  };

  const updateQuizQuestion = (stepId, qIndex, field, value) => {
    setSteps(prev => prev.map(step => {
      if (step.id !== stepId) return step;
      const draft = ensureQuizDraft(step);
      const updated = [...draft.questions];
      updated[qIndex] = { ...updated[qIndex], [field]: value };
      return { ...step, quizDraft: { ...draft, questions: updated } };
    }));
  };

  const removeQuizQuestion = (stepId, qIndex) => {
    setSteps(prev => prev.map(step => {
      if (step.id !== stepId) return step;
      const draft = ensureQuizDraft(step);
      const updated = draft.questions.filter((_, i) => i !== qIndex);
      return { ...step, quizDraft: { ...draft, questions: updated } };
    }));
  };

  const addOptionToQuestion = (stepId, qIndex) => {
    setSteps(prev => prev.map(step => {
      if (step.id !== stepId) return step;
      const draft = ensureQuizDraft(step);
      const updated = [...draft.questions];
      const q = { ...updated[qIndex] };
      q.options = [...(q.options || []), { text: '', isCorrect: false }];
      updated[qIndex] = q;
      return { ...step, quizDraft: { ...draft, questions: updated } };
    }));
  };

  const updateOptionInQuestion = (stepId, qIndex, optIndex, field, value) => {
    setSteps(prev => prev.map(step => {
      if (step.id !== stepId) return step;
      const draft = ensureQuizDraft(step);
      const updated = [...draft.questions];
      const q = { ...updated[qIndex] };
      const opts = [...(q.options || [])];
      opts[optIndex] = { ...opts[optIndex], [field]: value };
      q.options = opts;
      updated[qIndex] = q;
      return { ...step, quizDraft: { ...draft, questions: updated } };
    }));
  };

  const removeOptionFromQuestion = (stepId, qIndex, optIndex) => {
    setSteps(prev => prev.map(step => {
      if (step.id !== stepId) return step;
      const draft = ensureQuizDraft(step);
      const updated = [...draft.questions];
      const q = { ...updated[qIndex] };
      const opts = (q.options || []).filter((_, i) => i !== optIndex);
      q.options = opts;
      updated[qIndex] = q;
      return { ...step, quizDraft: { ...draft, questions: updated } };
    }));
  };

  const moveStep = (stepId, direction) => {
    const currentIndex = steps.findIndex(step => step.id === stepId);
    if (currentIndex === -1) return;

    const newSteps = [...steps];
    if (direction === 'up' && currentIndex > 0) {
      [newSteps[currentIndex], newSteps[currentIndex - 1]] = [newSteps[currentIndex - 1], newSteps[currentIndex]];
    } else if (direction === 'down' && currentIndex < newSteps.length - 1) {
      [newSteps[currentIndex], newSteps[currentIndex + 1]] = [newSteps[currentIndex + 1], newSteps[currentIndex]];
    }

    // Update order numbers
    newSteps.forEach((step, index) => {
      step.order = index + 1;
    });

    setSteps(newSteps);
  };

  const addResourceToStep = (stepId, resourceType) => {
    const newResource = {
      id: Date.now(),
      title: '',
      type: resourceType,
      link: '',
      description: '',
      file: null
    };

    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, resources: [...step.resources, newResource] }
        : step
    ));
  };

  const removeResourceFromStep = (stepId, resourceId) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, resources: step.resources.filter(r => r.id !== resourceId) }
        : step
    ));
  };

  const updateResourceInStep = (stepId, resourceId, field, value) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? {
            ...step,
            resources: step.resources.map(resource => 
              resource.id === resourceId 
                ? { ...resource, [field]: value }
                : resource
            )
          }
        : step
    ));
  };

  const handleFileSelect = (stepId, resourceId, file) => {
    updateResourceInStep(stepId, resourceId, 'file', file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description || !selectedCourse || steps.length === 0) {
      setError('Please fill in all required fields and add at least one step');
      return;
    }

    // Validate steps
    for (const step of steps) {
      if (!step.title || !step.description) {
        setError(`Please fill in all fields for step ${step.order}`);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('courseId', selectedCourse);
      formData.append('steps', JSON.stringify(steps));

      // Add files for each step
      steps.forEach((step, stepIndex) => {
        step.resources.forEach((resource, resourceIndex) => {
          if (resource.file) {
            formData.append(`step_${stepIndex}_resource_${resourceIndex}`, resource.file);
          }
        });
      });

      // If final test is requested, mark the last step as quizRequired in payload
      const stepsToSend = addFinalTest && steps.length > 0
        ? steps.map((s, idx) => idx === steps.length - 1 ? { ...s, quizRequired: true } : s)
        : steps;

      const response = await fetch('http://localhost:4000/api/learning-paths', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: (() => {
          const fd = new FormData();
          fd.append('title', title);
          fd.append('description', description);
          fd.append('courseId', selectedCourse);
          fd.append('steps', JSON.stringify(stepsToSend));
          steps.forEach((step, stepIndex) => {
            step.resources.forEach((resource, resourceIndex) => {
              if (resource.file) {
                fd.append(`step_${stepIndex}_resource_${resourceIndex}`, resource.file);
              }
            });
          });
          return fd;
        })()
      });

      if (response.ok) {
        setSuccess('Learning path created successfully!');
        setTimeout(() => {
          navigate('/learning-paths');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create learning path');
      }
    } catch (error) {
      console.error('Error creating learning path:', error);
      setError('Failed to create learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'link': return <Link className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Learning Path
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Build a step-by-step learning journey for your students
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter learning path title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describe the learning path"
                required
              />
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Learning Steps
              </h3>
              <button
                type="button"
                onClick={addStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={18} />
                Add Step
              </button>
            </div>

            {/* Final Test Toggle */}
            <div className="mb-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={addFinalTest}
                  onChange={(e) => setAddFinalTest(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                Add a Final Test on the last step (quiz required)
              </label>
              <p className="text-xs text-gray-500 mt-1">You can add the final quiz questions later from the Learning Session screen.</p>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No steps added yet. Click "Add Step" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    {/* Step Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                          Step {step.order}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveStep(step.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(step.id, 'down')}
                            disabled={index === steps.length - 1}
                            className="p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Step Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Step Title *
                        </label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Enter step title"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estimated Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={step.estimatedTime}
                          onChange={(e) => updateStep(step.id, 'estimatedTime', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Step Description *
                      </label>
                      <textarea
                        value={step.description}
                        onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Describe what students will learn in this step"
                        required
                      />
                    </div>

                    {/* Step Quiz Requirement */}
                    <div className="mb-4">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={step.quizRequired || false}
                          onChange={(e) => updateStep(step.id, 'quizRequired', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        Require passing a quiz to proceed from this step
                      </label>
                    </div>

                    {/* Inline Quiz Builder (Optional) */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => toggleQuizEditor(step.id)}
                        className="px-4 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700"
                      >
                        {activeQuizEditor === step.id ? 'Close Quiz Builder' : `Configure Quiz (Optional)${step.quizDraft?.questions?.length ? ` - ${step.quizDraft.questions.length} questions` : ''}`}
                      </button>
                    </div>

                    {activeQuizEditor === step.id && (
                      <div className="mb-6 p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quiz Title</label>
                            <input
                              type="text"
                              value={ensureQuizDraft(step).title}
                              onChange={(e) => updateQuizMeta(step.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder={`${step.title} Quiz`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passing Score (%)</label>
                            <input
                              type="number"
                              value={ensureQuizDraft(step).passingScore}
                              onChange={(e) => updateQuizMeta(step.id, 'passingScore', parseInt(e.target.value) || 70)}
                              min="0"
                              max="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Limit (min)</label>
                            <input
                              type="number"
                              value={ensureQuizDraft(step).timeLimit}
                              onChange={(e) => updateQuizMeta(step.id, 'timeLimit', parseInt(e.target.value) || 30)}
                              min="5"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={ensureQuizDraft(step).allowRetakes}
                                onChange={(e) => updateQuizMeta(step.id, 'allowRetakes', e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                              />
                              Allow Retakes
                            </label>
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Attempts</label>
                              <input
                                type="number"
                                value={ensureQuizDraft(step).maxAttempts}
                                onChange={(e) => updateQuizMeta(step.id, 'maxAttempts', parseInt(e.target.value) || 3)}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">Questions ({ensureQuizDraft(step).questions.length})</h4>
                            <button
                              type="button"
                              onClick={() => addQuizQuestion(step.id)}
                              className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg"
                            >
                              Add Question
                            </button>
                          </div>
                        </div>

                        {ensureQuizDraft(step).questions.map((q, qIndex) => (
                          <div key={q.id} className="mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                  value={q.type}
                                  onChange={(e) => updateQuizQuestion(step.id, qIndex, 'type', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                  <option value="mcq">Multiple Choice (Single)</option>
                                  <option value="multiple_choice">Multiple Choice (Multiple)</option>
                                  <option value="numerical">Numerical</option>
                                  <option value="long_answer">Long Answer</option>
                                  <option value="assignment">Upload Assignment</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points</label>
                                <input
                                  type="number"
                                  value={q.points}
                                  onChange={(e) => updateQuizQuestion(step.id, qIndex, 'points', parseInt(e.target.value) || 1)}
                                  min="1"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </div>
                            </div>
                            <div className="mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
                              <textarea
                                value={q.question}
                                onChange={(e) => updateQuizQuestion(step.id, qIndex, 'question', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>

                            {(q.type === 'mcq' || q.type === 'multiple_choice') && (
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</span>
                                  <button type="button" onClick={() => addOptionToQuestion(step.id, qIndex)} className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-600">Add Option</button>
                                </div>
                                {(q.options || []).map((opt, optIndex) => (
                                  <div key={optIndex} className="flex items-center gap-2 mb-1">
                                    <input
                                      type="checkbox"
                                      checked={!!opt.isCorrect}
                                      onChange={(e) => updateOptionInQuestion(step.id, qIndex, optIndex, 'isCorrect', e.target.checked)}
                                    />
                                    <input
                                      type="text"
                                      value={opt.text}
                                      onChange={(e) => updateOptionInQuestion(step.id, qIndex, optIndex, 'text', e.target.value)}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                      placeholder={`Option ${optIndex + 1}`}
                                    />
                                    <button type="button" onClick={() => removeOptionFromQuestion(step.id, qIndex, optIndex)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Remove</button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {q.type === 'numerical' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correct Value</label>
                                  <input
                                    type="number"
                                    value={q.numericAnswer}
                                    onChange={(e) => updateQuizQuestion(step.id, qIndex, 'numericAnswer', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tolerance (±)</label>
                                  <input
                                    type="number"
                                    value={q.numericTolerance}
                                    onChange={(e) => updateQuizQuestion(step.id, qIndex, 'numericTolerance', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  />
                                </div>
                              </div>
                            )}

                            {q.type === 'long_answer' && (
                              <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guidelines</label>
                                <textarea
                                  value={q.longAnswerGuidelines}
                                  onChange={(e) => updateQuizQuestion(step.id, qIndex, 'longAnswerGuidelines', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </div>
                            )}

                            {q.type === 'assignment' && (
                              <div className="mb-2">
                                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  <input
                                    type="checkbox"
                                    checked={!!q.requiresUpload}
                                    onChange={(e) => updateQuizQuestion(step.id, qIndex, 'requiresUpload', e.target.checked)}
                                  />
                                  Require student file upload
                                </label>
                              </div>
                            )}

                            <div className="flex justify-end">
                              <button type="button" onClick={() => removeQuizQuestion(step.id, qIndex)} className="text-sm px-3 py-1 rounded bg-red-100 text-red-700">Remove Question</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resources */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Resources
                        </h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addResourceToStep(step.id, 'pdf')}
                            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <FileText size={12} />
                            PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => addResourceToStep(step.id, 'video')}
                            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <Video size={12} />
                            Video
                          </button>
                          <button
                            type="button"
                            onClick={() => addResourceToStep(step.id, 'link')}
                            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <Link size={12} />
                            Link
                          </button>
                          <button
                            type="button"
                            onClick={() => addResourceToStep(step.id, 'image')}
                            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                          >
                            <Image size={12} />
                            Image
                          </button>
                        </div>
                      </div>

                      {step.resources.length > 0 && (
                        <div className="space-y-3">
                          {step.resources.map((resource) => (
                            <div key={resource.id} className="border border-gray-200 dark:border-gray-600 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getResourceIcon(resource.type)}
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {resource.type.toUpperCase()}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeResourceFromStep(step.id, resource.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <X size={16} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Title
                                  </label>
                                  <input
                                    type="text"
                                    value={resource.title}
                                    onChange={(e) => updateResourceInStep(step.id, resource.id, 'title', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Resource title"
                                  />
                                </div>

                                {resource.type === 'link' ? (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      URL
                                    </label>
                                    <input
                                      type="url"
                                      value={resource.link}
                                      onChange={(e) => updateResourceInStep(step.id, resource.id, 'link', e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                      placeholder="https://..."
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      File
                                    </label>
                                    <input
                                      type="file"
                                      onChange={(e) => handleFileSelect(step.id, resource.id, e.target.files[0])}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                      accept={resource.type === 'pdf' ? '.pdf' : resource.type === 'image' ? 'image/*' : 'video/*'}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={resource.description}
                                  onChange={(e) => updateResourceInStep(step.id, resource.id, 'description', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                  placeholder="Brief description of the resource"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || steps.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Creating...' : 'Create Learning Path'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateLearningPath;
