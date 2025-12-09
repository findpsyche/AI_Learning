/**
 * 应用入口 - 使用React Router
 * 文件: frontend-web/src/App.jsx
 * 功能: 主应用容器、路由管理
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './App.css';

const App = () => {
  return (
    <RouterProvider router={router} />
  );
};

export default App;
