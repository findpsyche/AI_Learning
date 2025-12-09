/**
 * DApp卡片组件 - 展示单个应用
 * 文件: frontend-web/src/components/DAppCard.jsx
 * 功能: 应用信息展示、选择交互
 */

import React from 'react';
import '../styles/DAppCard.css';

const DAppCard = ({ app, recommendReason, onSelect, isRecommended = false }) => {
  const appIcons = {
    'healing': '🎵',
    'theatre': '🎙️',
    'workshop': '🎼',
    'assistant': '🤖'
  };

  const appColors = {
    'healing': '#6B7AA1',
    'theatre': '#4ECDC4',
    'workshop': '#FFD93D',
    'assistant': '#95A3B3'
  };

  return (
    <div
      className={`dapp-card ${isRecommended ? 'recommended' : ''}`}
      onClick={onSelect}
    >
      {isRecommended && <div className="recommended-badge">⭐ 推荐</div>}

      <div className="card-header">
        <div
          className="app-icon"
          style={{ backgroundColor: appColors[app.type] }}
        >
          {appIcons[app.type]}
        </div>
        <div className="app-meta">
          <h3 className="app-name">{app.name}</h3>
          <span className="app-type">{app.category}</span>
        </div>
      </div>

      <p className="app-description">{app.description}</p>

      <div className="recommend-reason">
        <span className="reason-icon">💡</span>
        <span className="reason-text">{recommendReason}</span>
      </div>

      <div className="app-features">
        {app.features?.slice(0, 3).map((feature, idx) => (
          <span key={idx} className="feature-tag">
            {feature}
          </span>
        ))}
      </div>

      <button className="btn-enter">进入应用</button>
    </div>
  );
};

export default DAppCard;
