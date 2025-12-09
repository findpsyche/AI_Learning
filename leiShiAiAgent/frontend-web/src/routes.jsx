/**
 * 应用路由配置
 * 文件: frontend-web/src/routes.jsx
 * 功能: 定义所有应用路由
 */

import React, { useState, useEffect } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import EmotionDetectionPage from './pages/EmotionDetectionPage';
import HealingStationPage from './pages/HealingStationPage';
import SoundTheatrePage from './pages/SoundTheatrePage';
import MusicWorkshopPage from './pages/MusicWorkshopPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import MemoryLibraryPage from './pages/MemoryLibraryPage';

/**
 * 受保护路由组件 - 需要用户认证
 */
const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 检查用户是否已登录
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    setIsAuthenticated(!!(userId && username));
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="loading-container">加载中...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/welcome" replace />;
};

/**
 * 路由配置
 */
const routes = [
  {
    path: '/welcome',
    element: <WelcomePage />
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    )
  },
  {
    path: '/emotion-detection',
    element: (
      <ProtectedRoute>
        <EmotionDetectionPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/healing',
    element: (
      <ProtectedRoute>
        <HealingStationPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/theatre',
    element: (
      <ProtectedRoute>
        <SoundTheatrePage />
      </ProtectedRoute>
    )
  },
  {
    path: '/workshop',
    element: (
      <ProtectedRoute>
        <MusicWorkshopPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/assistant',
    element: (
      <ProtectedRoute>
        <VoiceAssistantPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/memory',
    element: (
      <ProtectedRoute>
        <MemoryLibraryPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/',
    element: <Navigate to="/welcome" replace />
  },
  {
    path: '*',
    element: <Navigate to="/welcome" replace />
  }
];

export const router = createBrowserRouter(routes);

export default routes;
