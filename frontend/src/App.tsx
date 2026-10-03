import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/ui/Layout';

// Pages
import { Login } from './pages/Auth/Login';
import { StudentDashboard } from './pages/Student/StudentDashboard';
import { StudentDocuments } from './pages/Student/StudentDocuments';
import { MockExams } from './pages/Student/MockExams';
import { StudentPlans } from './pages/Student/StudentPlans';
import { StudentReports } from './pages/Student/StudentReports';



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
            <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'FACULTY']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/documents" element={<StudentDocuments />} />
              <Route path="/student/plans" element={<StudentPlans />} />
              <Route path="/student/exams" element={<MockExams />} />
              <Route path="/student/reports" element={<StudentReports />} />
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
