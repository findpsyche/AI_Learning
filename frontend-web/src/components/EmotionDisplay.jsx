/**
 * 情绪展示组件 - 可视化情绪球体和强度
 * 文件: frontend-web/src/components/EmotionDisplay.jsx
 * 功能: 展示识别的情绪类型、强度和建议
 */

import React, { useEffect, useRef } from 'react';
import '../styles/EmotionDisplay.css';

const EmotionDisplay = ({ emotion }) => {
  const canvasRef = useRef(null);

  const emotionConfig = {
    sad: {
      name: '悲伤',
      color: '#6B7AA1',
      glow: '#9BAFD9',
      icon: '😢',
      advice: '听一些治愈音乐，让声音陪伴你'
    },
    calm: {
      name: '平静',
      color: '#4ECDC4',
      glow: '#81E6E1',
      icon: '😌',
      advice: '享受一个放松的声音剧场体验'
    },
    happy: {
      name: '快乐',
      color: '#FFD93D',
      glow: '#FFE66D',
      icon: '😊',
      advice: '一起创作音乐，分享你的快乐'
    },
    neutral: {
      name: '中性',
      color: '#95A3B3',
      glow: '#BCC5CF',
      icon: '😐',
      advice: '让个人助手帮你管理今天的任务'
    }
  };

  const config = emotionConfig[emotion.type] || emotionConfig.neutral;
  const intensity = emotion.intensity || 0.5;

  // 绘制粒子动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const particles = [];
    const particleCount = Math.floor(30 * intensity) + 10;

    class Particle {
      constructor() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 100 + 50;
        this.x = canvas.width / (2 * window.devicePixelRatio) + Math.cos(angle) * radius;
        this.y = canvas.height / (2 * window.devicePixelRatio) + Math.sin(angle) * radius;
        this.vx = (Math.random() - 0.5) * 3 * intensity;
        this.vy = (Math.random() - 0.5) * 3 * intensity;
        this.radius = Math.random() * 2 + 1;
        this.life = 1;
        this.decay = Math.random() * 0.005 + 0.002;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
      }

      draw() {
        ctx.fillStyle = config.glow + Math.floor(this.life * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (1 + (1 - this.life)), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制中心球体
      const centerX = canvas.width / (2 * window.devicePixelRatio);
      const centerY = canvas.height / (2 * window.devicePixelRatio);
      const sphereRadius = 80 + intensity * 20;

      // 渐变效果
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sphereRadius);
      gradient.addColorStop(0, config.glow);
      gradient.addColorStop(1, config.color);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      ctx.fill();

      // 更新和绘制粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();

        if (particle.life <= 0) {
          particles.splice(i, 1);
        } else {
          particle.draw();
        }
      }

      // 补充新粒子
      if (particles.length < particleCount / 2) {
        particles.push(new Particle());
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity, config]);

  return (
    <div className="emotion-display">
      <div className="emotion-canvas-wrapper">
        <canvas ref={canvasRef} className="emotion-canvas"></canvas>
        <div className="emotion-center-icon">{config.icon}</div>
      </div>

      <div className="emotion-info">
        <h2 className="emotion-name">{config.name}</h2>
        
        <div className="intensity-display">
          <label>情绪强度</label>
          <div className="intensity-bar">
            <div
              className="intensity-fill"
              style={{
                width: `${intensity * 100}%`,
                backgroundColor: config.glow
              }}
            ></div>
          </div>
          <span className="intensity-value">{Math.round(intensity * 100)}%</span>
        </div>

        <div className="emotion-insight">
          <h3>建议</h3>
          <p>{config.advice}</p>
        </div>

        <div className="emotion-tips">
          <p>💡 根据您的情绪，我已为您准备了最合适的应用推荐</p>
        </div>
      </div>
    </div>
  );
};

export default EmotionDisplay;
