import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import SkillPage from './pages/SkillPage';
import LiveSession from './pages/LiveSession';
import ProtectedRoute from './components/ProtectedRoute';
import StudentSessions from './pages/StudentSessions';
import LiveSessionsPage from './pages/LiveSessionsPage';
import CreateLiveSession from './pages/CreateLiveSession';
import JoinLiveSession from './pages/JoinLiveSession';
import '@livekit/components-styles';
import DashboardLayout from './components/DashboardLayout';
import CreateClassroom from './pages/CreateClassroom';
import CreateCourse from './pages/CreateCourse';
import InstructorCourses from './pages/InstructorCourses';
import Classrooms from './pages/Classrooms';
import InstructorClassrooms from './pages/InstructorClassrooms';
import StudentInfo from './pages/StudentInfo';
import JoinClassroom from './pages/JoinClassroom';
import StudentClassrooms from './pages/StudentClassrooms';
import StudentClassroomDetail from './pages/StudentClassroomDetail';
import InstructorClassroomCourses from './pages/InstructorClassroomCourses';
import CourseDetail from './pages/CourseDetail';
import LiveSessionRoom from './pages/LiveSessionRoom';
import ClassroomDetail from './pages/ClassroomDetail';


function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student-sessions" element={<StudentSessions />} />
        <Route path="/live-sessions" element={<LiveSessionsPage />} />
        <Route path="/skills/:id" element={<SkillPage />} />
        <Route path="/live-session" element={<LiveSession />} />
        <Route path="/instructor/create" element={<CreateLiveSession />} />
        <Route path="/student/join/:roomName/:username" element={<JoinLiveSession />} />

        <Route path="/join/:roomName/:username" element={<JoinLiveSession />} />
        <Route
          path="/create-classroom"
          element={
            <ProtectedRoute role="instructor">
              <CreateClassroom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-course"
          element={
            <ProtectedRoute role="instructor">
              <CreateCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/courses"
          element={
            <ProtectedRoute role="instructor">
              <InstructorCourses />
            </ProtectedRoute>
          }
        />
        <Route path="/classrooms" element={<Classrooms />} />
        <Route path="/student-info" element={<StudentInfo />} />
        <Route path="/join-classrooms" element={<JoinClassroom />} />
        <Route path="/student/classrooms" element={<StudentClassrooms />} />

        <Route
          path="/instructor/classrooms"
          element={
            <ProtectedRoute role="instructor">
              <InstructorClassrooms />
            </ProtectedRoute>
          }
        />

        <Route
  path="/student-dashboard"
  element={
    <ProtectedRoute role="student">
      <StudentDashboard />
    </ProtectedRoute>
  }
/>


        {/* Protected routes */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/classroom/:id"
          element={
            <ProtectedRoute role="instructor">
              <ClassroomDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/classroom/:classroomId/courses"
          element={
            <ProtectedRoute role="instructor">
              <InstructorClassroomCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/classroom/:id"
          element={
            <ProtectedRoute role="student">
              <ClassroomDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classroom/:classroomId/courses"
          element={
            <ProtectedRoute role="student">
              <StudentClassroomDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-session/:roomName"
          element={
            <ProtectedRoute>
              <LiveSessionRoom />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
