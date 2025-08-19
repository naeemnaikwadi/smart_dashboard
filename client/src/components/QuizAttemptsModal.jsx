import React, { useEffect, useState } from 'react';

const QuizAttemptsModal = ({ quizId, onClose }) => {
  const [attempts, setAttempts] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grades, setGrades] = useState({}); // {attemptId: {questionId: {pointsEarned, feedback}}}

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [qRes, aRes] = await Promise.all([
          fetch(`http://localhost:4000/api/quizzes/${quizId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`http://localhost:4000/api/quizzes/${quizId}/attempts`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (!qRes.ok) throw new Error('Failed to load quiz');
        if (!aRes.ok) throw new Error('Failed to load attempts');
        const q = await qRes.json();
        const a = await aRes.json();
        setQuiz(q);
        setAttempts(a);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [quizId]);

  const getQuestion = (questionId) => quiz?.questions?.find(q => String(q._id) === String(questionId));

  const updateGrade = (attemptId, questionId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [attemptId]: {
        ...(prev[attemptId] || {}),
        [questionId]: {
          ...(prev[attemptId]?.[questionId] || {}),
          [field]: value
        }
      }
    }));
  };

  const submitGrades = async (attemptId) => {
    try {
      const token = localStorage.getItem('token');
      const attemptGradesObj = grades[attemptId] || {};
      const payload = Object.entries(attemptGradesObj).map(([questionId, g]) => ({
        questionId,
        pointsEarned: Number(g.pointsEarned) || 0,
        feedback: g.feedback || ''
      }));
      const res = await fetch(`http://localhost:4000/api/quizzes/attempts/${attemptId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grades: payload })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit grades');
      }
      alert('Grades saved');
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">Loading attempts...</div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-5xl relative max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quiz Attempts</h2>
        <button onClick={onClose} className="px-3 py-1 bg-gray-700 text-white rounded">Close</button>
      </div>
      {error && (
        <div className="p-4 text-red-600">{error}</div>
      )}
      <div className="p-4 space-y-4">
        {attempts.length === 0 && (
          <div className="text-gray-600">No attempts yet.</div>
        )}
        {attempts.map((attempt) => (
          <div key={attempt._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div>Student: {attempt.studentId?.name || attempt.studentId}</div>
                <div>Score: {attempt.totalScore}/{attempt.maxScore} ({attempt.percentage}%)</div>
                <div>Status: {attempt.passed ? 'PASSED' : 'NOT PASSED'}</div>
              </div>
              <button onClick={() => submitGrades(attempt._id)} className="px-3 py-1 bg-blue-600 text-white rounded">Save Grades</button>
            </div>

            <div className="space-y-3">
              {attempt.answers.map((ans, idx) => {
                const q = getQuestion(ans.questionId) || {};
                const needsGrading = q.type === 'long_answer' || q.type === 'assignment';
                return (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">Q{idx+1}. {q.question}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Student Answer: {Array.isArray(ans.answer) ? ans.answer.join(', ') : (typeof ans.answer === 'object' ? (ans.answer.fileName || ans.answer.fileUrl || 'Uploaded') : String(ans.answer || ''))}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Current Points: {ans.pointsEarned}/{q.points || 0}</div>
                    {needsGrading && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Points Earned</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={grades[attempt._id]?.[ans.questionId]?.pointsEarned ?? ans.pointsEarned ?? 0}
                            onChange={(e) => updateGrade(attempt._id, ans.questionId, 'pointsEarned', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Feedback</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            value={grades[attempt._id]?.[ans.questionId]?.feedback ?? ans.feedback ?? ''}
                            onChange={(e) => updateGrade(attempt._id, ans.questionId, 'feedback', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizAttemptsModal;


