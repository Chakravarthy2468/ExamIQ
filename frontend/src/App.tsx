import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/ui/Layout';

// Pages
import { Login } from './pages/Auth/Login';
import { StudentDashboard } from './pages/Student/StudentDashboard';
import { FacultyDashboard } from './pages/Faculty/FacultyDashboard';
import { AdminDashboard } from './pages/Admin/AdminDashboard';

// Dummy pages for routes we haven't built out fully yet
const ComingSoon = ({ title }: { title: string }) => (
  <div>
    <h1>{title}</h1>
    <p>This module is under construction in Phase 26-30.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout><ProtectedRoute /></Layout>}>
            {/* Redirect root to appropriate dashboard based on role */}
            <Route path="/" element={<Navigate to="/student" replace />} />

            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/exams" element={<ComingSoon title="Mock Exams" />} />
              <Route path="/student/reports" element={<ComingSoon title="Readiness Reports" />} />
            </Route>

            {/* Faculty Routes */}
            <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
              <Route path="/faculty" element={<FacultyDashboard />} />
              <Route path="/faculty/review" element={<ComingSoon title="Review Queue" />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<ComingSoon title="User Management" />} />
            </Route>
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
