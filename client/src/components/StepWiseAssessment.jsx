import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Target, Clock, BookOpen } from 'lucide-react';

const StepWiseAssessment = ({ learningPath, onComplete, userProgress }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  // Generate assessment steps based on learning path steps
  const generateAssessmentSteps = () => {
    if (!learningPath?.steps) return [];
    
    const steps = [];
    let stepNumber = 1;
    
    learningPath.steps.forEach((step, index) => {
      // Add content understanding step
      steps.push({
        id: `content-${index}`,
        type: 'content',
        title: `Step ${stepNumber}: Content Understanding`,
        description: `Review and understand: ${step.title}`,
        resource: step,
        questions: [
          {
            id: `q1-${index}`,
            question: `What is the main concept covered in "${step.title}"?`,
            type: 'text',
            required: true
          },
          {
            id: `q2-${index}`,
            question: `Rate your understanding of this content (1-5):`,
            type: 'rating',
            required: true
          },
          {
            id: `q3-${index}`,
            question: `What are the key takeaways from this step?`,
            type: 'textarea',
            required: true
          }
        ]
      });
      stepNumber++;

      // Add practical application step
      steps.push({
        id: `practice-${index}`,
        type: 'practice',
        title: `Step ${stepNumber}: Practical Application`,
        description: `Apply what you learned from: ${step.title}`,
        resource: step,
        questions: [
          {
            id: `q4-${index}`,
            question: `How would you apply this knowledge in a real-world scenario?`,
            type: 'textarea',
            required: true
          },
          {
            id: `q5-${index}`,
            question: `What challenges might you face when implementing this?`,
            type: 'textarea',
            required: false
          },
          {
            id: `q6-${index}`,
            question: `Can you provide an example of this concept in action?`,
            type: 'textarea',
            required: true
          }
        ]
      });
      stepNumber++;
    });

    // Add final assessment step
    steps.push({
      id: 'final-assessment',
      type: 'assessment',
      title: `Step ${stepNumber}: Final Assessment`,
      description: 'Comprehensive evaluation of your learning',
      questions: [
        {
          id: 'final-1',
          question: 'What are the three most important concepts you learned?',
          type: 'textarea',
          required: true
        },
        {
          id: 'final-2',
          question: 'How confident are you in applying this knowledge? (1-10)',
          type: 'rating',
          required: true
        },
        {
          id: 'final-3',
          question: 'What areas would you like to explore further?',
          type: 'textarea',
          required: false
        },
        {
          id: 'final-4',
          question: 'Can you summarize the learning path in your own words?',
          type: 'textarea',
          required: true
        },
        {
          id: 'final-5',
          question: 'What was the most challenging part of this learning journey?',
          type: 'textarea',
          required: false
        },
        {
          id: 'final-6',
          question: 'How would you rate the overall learning experience? (1-5)',
          type: 'rating',
          required: true
        }
      ]
    });

    return steps;
  };

  const steps = generateAssessmentSteps();
  const currentStepData = steps[currentStep];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setShowResults(true);
    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    if (onComplete) {
      onComplete({
        learningPathId: learningPath._id,
        stepsCompleted: steps.length,
        answers: answers,
        timeSpent: totalTimeSpent,
        completedAt: new Date()
      });
    }
  };

  const renderQuestion = (question) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your answer..."
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your detailed answer..."
          />
        );
      
      case 'rating':
        const maxRating = question.question.includes('1-10') ? 10 : 5;
        return (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                onClick={() => handleAnswerChange(question.id, rating)}
                className={`w-10 h-10 rounded-full border-2 transition-colors ${
                  answers[question.id] === rating
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepIcon = (stepType) => {
    switch (stepType) {
      case 'content':
        return <BookOpen className="w-5 h-5" />;
      case 'practice':
        return <Target className="w-5 h-5" />;
      case 'assessment':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const getStepColor = (stepType) => {
    switch (stepType) {
      case 'content':
        return 'text-blue-600 bg-blue-100';
      case 'practice':
        return 'text-green-600 bg-green-100';
      case 'assessment':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete!</h2>
          <p className="text-gray-600">Great job completing the learning path assessment.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Your Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{steps.length}</div>
              <div className="text-sm text-blue-600">Steps Completed</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</div>
              <div className="text-sm text-green-600">Time Spent</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(answers).length}
              </div>
              <div className="text-sm text-purple-600">Questions Answered</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Your Answers</h3>
          {steps.map((step, index) => (
            <div key={step.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
              <p className="text-gray-600 mb-3">{step.description}</p>
              {step.questions.map((question) => (
                <div key={question.id} className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">{question.question}</p>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {answers[question.id] || 'No answer provided'}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading assessment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Step-wise Assessment</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                index === currentStep
                  ? 'bg-blue-600 text-white'
                  : index < currentStep
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                getStepIcon(step.type)
              )}
              <span className="hidden sm:inline">Step {index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${getStepColor(currentStepData.type)}`}>
            {getStepIcon(currentStepData.type)}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h3>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentStepData.questions.map((question) => (
            <div key={question.id} className="border-l-4 border-blue-200 pl-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderQuestion(question)}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
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

        {currentStep === steps.length - 1 ? (
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Complete Assessment
            <CheckCircle className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StepWiseAssessment;
