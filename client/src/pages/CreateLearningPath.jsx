import React, { useState } from 'react';
import { createLearningPath } from '../services/learningPathService';

export default function CreateLearningPath() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [resources, setResources] = useState([]);

  const addResource = () => {
    setResources([...resources, { title: '', type: '', link: '', uploadedFile: '' }]);
  };

  const handleSubmit = async () => {
    try {
      await createLearningPath({
        title,
        description,
        estimatedTime,
        resources,
        instructorId: 'dummy-id' // Replace with real instructor ID
      });
      alert('Learning path created!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Create Learning Path</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="block border p-2 my-2 w-full" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="block border p-2 my-2 w-full" />
      <input value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="Estimated Time (e.g., 2 weeks)" className="block border p-2 my-2 w-full" />

      <button onClick={addResource} className="bg-green-500 text-white px-4 py-2 rounded">Add Resource</button>

      {resources.map((res, i) => (
        <div key={i} className="mt-2">
          <input placeholder="Title" className="border p-2 mr-2"
            onChange={(e) => {
              const r = [...resources];
              r[i].title = e.target.value;
              setResources(r);
            }}
          />
          <input placeholder="Type (link/pdf)" className="border p-2 mr-2"
            onChange={(e) => {
              const r = [...resources];
              r[i].type = e.target.value;
              setResources(r);
            }}
          />
          <input placeholder="Link" className="border p-2"
            onChange={(e) => {
              const r = [...resources];
              r[i].link = e.target.value;
              setResources(r);
            }}
          />
        </div>
      ))}

      <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded">Submit</button>
    </div>
  );
}
