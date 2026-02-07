import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * PublicRoute для React Router v6+
 * Стратегия: REDIRECT IF LOGGED IN
 */
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // ✅ Если уже аутентифицирован — редирект на dashboard
  if (isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  // ✅ Если не аутентифицирован — показываем страницу
  return <>{children}</>;
};