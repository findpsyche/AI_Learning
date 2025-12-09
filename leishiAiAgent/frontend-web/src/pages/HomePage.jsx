/**
 * 主页 - 情绪识别入口
 * 文件: frontend-web/src/pages/HomePage.jsx
 * 功能: 显示招呼语、情绪识别入口、快速导航
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingEmoji, setLoadingEmoji] = useState('🎵');

  useEffect(() => {
    const user = localStorage.getItem('username') || '用户';
    setUsername(user);

    // 根据时间生成不同的招呼
    const hour = new Date().getHours();
    let greetText = '';
    if (hour < 12) {
      greetText = '早上好';
    } else if (hour < 18) {
      greetText = '下午好';
    } else {
      greetText = '晚上好';
    }
    setGreeting(greetText);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const emojiList = ['🎵', '🎶', '🎼', '🎧', '✨'];
    let index = 0;
    const interval = setInterval(() => {
      setLoadingEmoji(emojiList[index]);
      index = (index + 1) % emojiList.length;
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const handleDetectEmotion = () => {
    navigate('/emotion-detection');
  };

  const handleViewMemory = () => {
    navigate('/memory');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/welcome');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="header-left">
          <h1 className="logo-text">🎵 声境</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{username}</span>
          <button className="btn-small" onClick={handleLogout}>登出</button>
        </div>
      </div>

      <div className="home-content">
        {/* 欢迎区域 */}
        <section className="welcome-section">
          <div className="time-display">
            {currentTime.toLocaleTimeString('zh-CN')}
          </div>
          <h2 className="welcome-text">
            <span className="greeting">{greeting}，</span>
            <span className="username-highlight">{username}</span>
            <span className="exclamation">今天也很棒勒！</span>
          </h2>
          <p className="subtitle-text">
            让声音陪伴您的每一刻，AI帮您找到最适合的情绪疗愈方式
          </p>
        </section>

        {/* 快速导航 */}
        <section className="quick-nav">
          <div className="nav-title">快速导航</div>
          <div className="nav-buttons">
            <button 
              className="nav-btn nav-detect"
              onClick={handleDetectEmotion}
            >
              <span className="nav-icon">🎤</span>
              <span className="nav-label">识别情绪</span>
            </button>
            <button 
              className="nav-btn nav-memory"
              onClick={handleViewMemory}
            >
              <span className="nav-icon">📖</span>
              <span className="nav-label">我的记忆</span>
            </button>
          </div>
        </section>

        {/* 主操作区 */}
        <section className="main-action">
          <div className="action-card emotion-card">
            <div className="action-icon">
              <div className="pulse-ring"></div>
              {loadingEmoji}
            </div>
            <h3>开始聊天</h3>
            <p>通过语音或文字聊天，AI将识别您的情绪并推荐最适合的应用</p>
            <button 
              className="btn-primary"
              onClick={handleDetectEmotion}
            >
              现在开始
            </button>
          </div>
        </section>

        {/* 功能介绍 */}
        <section className="features-intro">
          <h3>声境为您提供</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-header sad">😢</div>
              <h4>感到悲伤</h4>
              <p>声音疗愈站，AI陪伴对话、治愈音乐、冥想引导</p>
            </div>
            <div className="feature-card">
              <div className="feature-header calm">😌</div>
              <h4>感到平静</h4>
              <p>声音剧场，播客、电台、有声书、知识漫谈</p>
            </div>
            <div className="feature-card">
              <div className="feature-header happy">😊</div>
              <h4>感到快乐</h4>
              <p>AI音乐工坊，哼唱转歌、编曲、智能混音</p>
            </div>
            <div className="feature-card">
              <div className="feature-header neutral">😐</div>
              <h4>保持中性</h4>
              <p>个人声音助手，问答、播报、日程、灵感记录</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="home-footer">
        <p>© 2025 声境 SoundScape | 声音是一种力量 🎵</p>
      </footer>
    </div>
  );
};

export default HomePage;
