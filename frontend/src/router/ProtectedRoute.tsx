import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
// import { LoadingScreen } from '@/components/layout/LoadingScreen';
import Loading from '@/components/Loading';

/**
 * ProtectedRoute для React Router v6+
 * Стратегия: INSTANT RENDER + BACKGROUND VALIDATION
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isChecking } = useAuth();
  const location = useLocation();

  // 1. МГНОВЕННЫЙ РЕНДЕР если пользователь есть в localStorage
  // Пользователь сразу видит страницу, сессия проверяется в фоне
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 2. Если проверяем сессию — показываем плэйсхолдер
  // (первые 500мс приложения, если данные в localStorage есть)
  if (isChecking) {
    return <Loading />;
  }

  // 3. Если не аутентифицирован — редирект на логин
  return <Navigate to="/signin" state={{ from: location }} replace />;
};