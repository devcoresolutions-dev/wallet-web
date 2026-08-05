import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import ProtectedLayout from '../layouts/ProtectedLayout';

// Guards
import ProtectedRoute from './ProtectedRoute';

// Páginas Públicas
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import ResetPasswordPage from '../pages/public/ResetPasswordPage';

// Páginas Protegidas
import DashboardPage from '../pages/protected/DashboardPage';
import OperationsPage from '../pages/protected/OperationsPage';
import TransactionsPage from '../pages/protected/TransactionsPage';
import RateAnalyticsPage from '../pages/protected/RateAnalyticsPage';
import NotificationsPage from '../pages/protected/NotificationsPage';
import ChatbotPage from '../pages/protected/ChatbotPage';
import SettingsPage from '../pages/protected/SettingsPage';

// 404
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/analytics" element={<RateAnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Ruta por defecto (404) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
