import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SkillList from './pages/SkillList';
import LiveSession from './pages/LiveSession';
import CreateLearningPath from './pages/CreateLearningPath';
import ViewLearningPaths from './pages/ViewLearningPaths';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SkillList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ViewLearningPaths />} />
        <Route path="/create-learning-path" element={<CreateLearningPath />} />
        <Route path="/live/:id" element={<LiveSession sessionId="demoSession" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;