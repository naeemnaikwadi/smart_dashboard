import React, { useEffect, useState } from 'react';
import { fetchAllLearningPaths, updateProgress } from '../services/learningPathService';

export default function ViewLearningPaths() {
  const [paths, setPaths] = useState([]);
  const learnerId = 'dummy-learner-id'; // replace with real user ID from auth

  useEffect(() => {
    const load = async () => {
      const res = await fetchAllLearningPaths();
      setPaths(res.data);
    };
    load();
  }, []);
  const markProgress = async (pathId) => {
    const progress = Math.floor(Math.random() * 100);
    const timeSpent = Math.floor(Math.random() * 300);
    await updateProgress({ pathId, learnerId, progress, timeSpent });
    alert(`Progress updated to ${progress}%`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Available Learning Paths</h2>
      {paths.map((path) => (
        <div key={path._id} className="border p-4 rounded mb-4 bg-white">
          <h3 className="text-xl font-semibold">{path.title}</h3>
          <p>{path.description}</p>
          <p className="text-sm text-gray-600">Estimated time: {path.estimatedTime}</p>
          <ul className="mt-2">
            {path.resources.map((res, idx) => (
              <li key={idx} className="text-blue-700 underline">
                {res.type === 'link' ? <a href={res.link} target="_blank" rel="noreferrer">{res.title}</a> : res.title}
              </li>
            ))}
          </ul>
          <button onClick={() => markProgress(path._id)} className="mt-2 px-4 py-1 bg-purple-600 text-white rounded">Update Progress</button>

        </div>
      ))}
    </div>
  );
}
