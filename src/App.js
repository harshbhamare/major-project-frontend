import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Public join page
import JoinRoom from './pages/student/JoinRoom';

// Layouts
import Layout from './components/Layout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';

// Faculty pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ContentUpload from './pages/faculty/ContentUpload';
import ContentList from './pages/faculty/ContentList';
import TopicEditor from './pages/faculty/TopicEditor';
import ModuleBuilder from './pages/faculty/ModuleBuilder';
import ModuleList from './pages/faculty/ModuleList';
import QuizManager from './pages/faculty/QuizManager';
import FacultyResults from './pages/faculty/FacultyResults';
import Rooms from './pages/faculty/Rooms';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentModules from './pages/student/StudentModules';
import ModuleView from './pages/student/ModuleView';
import QuizAttempt from './pages/student/QuizAttempt';
import StudentResults from './pages/student/StudentResults';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/join" element={<JoinRoom />} />
          <Route path="/join/:code" element={<JoinRoom />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Faculty routes */}
          <Route path="/faculty" element={<ProtectedRoute roles={['faculty']}><Layout /></ProtectedRoute>}>
            <Route index element={<FacultyDashboard />} />
            <Route path="upload" element={<ContentUpload />} />
            <Route path="content" element={<ContentList />} />
            <Route path="content/:id/topics" element={<TopicEditor />} />
            <Route path="modules" element={<ModuleList />} />
            <Route path="modules/new" element={<ModuleBuilder />} />
            <Route path="modules/:id/edit" element={<ModuleBuilder />} />
            <Route path="modules/:id/quiz" element={<QuizManager />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="results" element={<FacultyResults />} />
          </Route>

          {/* Student routes */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><Layout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="modules" element={<StudentModules />} />
            <Route path="modules/:id" element={<ModuleView />} />
            <Route path="quiz/:id" element={<QuizAttempt />} />
            <Route path="results" element={<StudentResults />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
