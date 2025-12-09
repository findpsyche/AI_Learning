/**
 * 欢迎页 - SoundScape入口
 * 文件: frontend-web/src/pages/WelcomePage.jsx
 * 功能: 展示产品理念、用户登录/注册、授权权限
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WelcomePage.css';

const WelcomePage = ({ onUserLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  // 背景粒子动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 100;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.fillStyle = `rgba(102, 153, 204, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      // 调用后端登录API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!response.ok) throw new Error('登录失败');

      const data = await response.json();
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', username);

      onUserLogin?.(data);
      navigate('/home');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('请授权麦克风访问权限');
      } else {
        setError('登录失败: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      <canvas ref={canvasRef} className="background-animation" />
      
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="logo">🎵</div>
          <h1 className="title">声 境</h1>
          <p className="subtitle">SoundScape</p>
        </div>

        <div className="welcome-tagline">
          <h2>声音是一种力量</h2>
          <p>通过AI识别情绪，为您创造个性化的声音体验</p>
        </div>

        <div className="welcome-features">
          <div className="feature-item">
            <span className="feature-icon">🎧</span>
            <div>
              <h3>情绪识别</h3>
              <p>AI识别您的情绪状态</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎼</span>
            <div>
              <h3>智能推荐</h3>
              <p>根据情绪推荐应用场景</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✨</span>
            <div>
              <h3>声音娱乐</h3>
              <p>疗愈、创意、助手多种选择</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💾</span>
            <div>
              <h3>长期记忆</h3>
              <p>保存您的每次体验和情绪</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">昵称</label>
            <input
              id="username"
              type="text"
              placeholder="输入您的昵称"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              maxLength={20}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? '授权中...' : '开始体验'}
          </button>
        </form>

        <div className="permissions-note">
          <p>💡 需要授权麦克风权限以实现语音输入和情绪识别</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
