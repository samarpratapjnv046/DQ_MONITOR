import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import AttachDatasetPage from './pages/AttachDatasetPage';
import EmailNotificationsPage from './pages/EmailNotificationsPage';
import DrillDownPage from './pages/DrillDownPage';
import RuleMappingPage from './pages/RuleMappingPage';
import './styles/global.css';

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem('dq_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="attach/*" element={<AttachDatasetPage />} />
            <Route path="email/*" element={<EmailNotificationsPage />} />
            <Route path="drilldown/*" element={<DrillDownPage />} />
            <Route path="rulemapping/*" element={<RuleMappingPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
