/**
 * 记忆图书馆页面
 * 文件: frontend-web/src/pages/MemoryLibraryPage.jsx
 * 功能: 查看、搜索、分析用户的情绪记录和记忆
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import '../styles/MemoryLibraryPage.css';

const MemoryLibraryPage = () => {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [filteredMemories, setFilteredMemories] = useState([]);
  const [viewMode, setViewMode] = useState('timeline'); // timeline, emotion, stats
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('all');
  const [emotionStats, setEmotionStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const emotions = {
    sad: { label: '悲伤', color: '#6B7AA1', emoji: '😢' },
    calm: { label: '平静', color: '#4ECDC4', emoji: '😌' },
    happy: { label: '快乐', color: '#FFD93D', emoji: '😊' },
    neutral: { label: '中性', color: '#95A3B3', emoji: '😐' }
  };

  // 加载记忆数据
  useEffect(() => {
    const loadMemories = async () => {
      try {
        setIsLoading(true);
        // 模拟加载数据
        const mockMemories = [
          {
            id: 1,
            title: '今天的思考',
            content: '在疗愈站做了一次冥想，感到内心很平静...',
            emotion: 'calm',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            duration: 25,
            app: '声音疗愈站',
            tags: ['冥想', '放松', '平静']
          },
          {
            id: 2,
            title: '创意灵感',
            content: '在音乐工坊创作了一首新歌，旋律很优美...',
            emotion: 'happy',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            duration: 45,
            app: 'AI音乐工坊',
            tags: ['创作', '音乐', '灵感']
          },
          {
            id: 3,
            title: '今天的感受',
            content: '心情有些沉重，但听了治愈音乐后感到舒缓...',
            emotion: 'sad',
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            duration: 30,
            app: '声音疗愈站',
            tags: ['情绪', '治愈', '放松']
          },
          {
            id: 4,
            title: '学习笔记',
            content: '收听了心理学播客，学到了许多关于压力管理的方法...',
            emotion: 'neutral',
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            duration: 32,
            app: '声音剧场',
            tags: ['学习', '知识', '播客']
          },
          {
            id: 5,
            title: '开心的一天',
            content: '在音乐工坊和朋友一起创作，每个音符都充满了欢乐...',
            emotion: 'happy',
            timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            duration: 60,
            app: 'AI音乐工坊',
            tags: ['分享', '协作', '创意']
          }
        ];

        setMemories(mockMemories);
        setFilteredMemories(mockMemories);

        // 计算情绪统计
        const stats = {};
        Object.keys(emotions).forEach(key => {
          stats[key] = mockMemories.filter(m => m.emotion === key).length;
        });
        setEmotionStats(stats);
        setIsLoading(false);
      } catch (error) {
        console.error('加载记忆失败:', error);
        setIsLoading(false);
      }
    };

    loadMemories();
  }, []);

  // 过滤记忆
  useEffect(() => {
    let filtered = memories;

    if (selectedEmotion !== 'all') {
      filtered = filtered.filter(m => m.emotion === selectedEmotion);
    }

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredMemories(filtered);
  }, [searchTerm, selectedEmotion, memories]);

  // 删除记忆
  const deleteMemory = async (id) => {
    try {
      setMemories(memories.filter(m => m.id !== id));
      if (selectedMemory?.id === id) {
        setSelectedMemory(null);
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 时间线视图
  const renderTimelineView = () => (
    <div className="timeline-view">
      <div className="timeline-list">
        {filteredMemories.length > 0 ? (
          filteredMemories.map(memory => (
            <div 
              key={memory.id}
              className={`timeline-item ${selectedMemory?.id === memory.id ? 'active' : ''}`}
              onClick={() => setSelectedMemory(memory)}
            >
              <div className="timeline-dot" style={{ background: emotions[memory.emotion].color }}></div>
              <div className="timeline-content">
                <div className="memory-header">
                  <h3>{memory.title}</h3>
                  <span className="emotion-badge" style={{ background: emotions[memory.emotion].color }}>
                    {emotions[memory.emotion].emoji} {emotions[memory.emotion].label}
                  </span>
                </div>
                <p className="memory-preview">{memory.content}</p>
                <div className="memory-meta">
                  <span className="app-tag">{memory.app}</span>
                  <span className="time-ago">{getTimeAgo(memory.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>没有找到匹配的记忆</p>
          </div>
        )}
      </div>

      {selectedMemory && (
        <div className="memory-detail">
          <div className="detail-header">
            <h2>{selectedMemory.title}</h2>
            <div className="detail-actions">
              <button className="share-btn" title="分享">📤</button>
              <button 
                className="delete-btn" 
                onClick={() => deleteMemory(selectedMemory.id)}
                title="删除"
              >
                🗑️
              </button>
            </div>
          </div>

          <div className="detail-emotion">
            <span className="emotion-large" style={{ background: emotions[selectedMemory.emotion].color }}>
              {emotions[selectedMemory.emotion].emoji}
            </span>
            <div className="emotion-info">
              <p className="emotion-label">{emotions[selectedMemory.emotion].label}</p>
              <p className="emotion-time">{selectedMemory.timestamp.toLocaleString('zh-CN')}</p>
            </div>
          </div>

          <div className="detail-content">
            <p>{selectedMemory.content}</p>
          </div>

          <div className="detail-tags">
            {selectedMemory.tags.map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>

          <div className="detail-stats">
            <div className="stat">
              <span className="stat-label">应用</span>
              <span className="stat-value">{selectedMemory.app}</span>
            </div>
            <div className="stat">
              <span className="stat-label">时长</span>
              <span className="stat-value">{selectedMemory.duration}分钟</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 情绪视图
  const renderEmotionView = () => (
    <div className="emotion-view">
      <div className="emotion-stats-grid">
        {Object.entries(emotions).map(([key, emotion]) => {
          const count = emotionStats[key] || 0;
          const percentage = memories.length > 0 ? (count / memories.length) * 100 : 0;
          
          return (
            <div key={key} className="emotion-stat-card">
              <div className="stat-emoji">{emotion.emoji}</div>
              <h3>{emotion.label}</h3>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{
                    width: `${percentage}%`,
                    background: emotion.color
                  }}
                ></div>
              </div>
              <p className="stat-count">{count} 次</p>
              <p className="stat-percentage">{Math.round(percentage)}%</p>
            </div>
          );
        })}
      </div>

      <div className="emotion-trends">
        <h3>情绪趋势（最近30天）</h3>
        <div className="trend-chart">
          <div className="trend-placeholder">
            <p>📊 情绪变化趋势图</p>
            <p style={{ fontSize: '12px', color: '#999' }}>数据每周更新</p>
          </div>
        </div>
      </div>

      <div className="emotion-insights">
        <h3>✨ 情绪洞察</h3>
        <div className="insights-list">
          <div className="insight">
            <span className="insight-icon">🎯</span>
            <p>在使用疗愈站时，你最经常感到平静和放松</p>
          </div>
          <div className="insight">
            <span className="insight-icon">🎵</span>
            <p>音乐创作让你感到充满创意和快乐</p>
          </div>
          <div className="insight">
            <span className="insight-icon">📚</span>
            <p>通过播客学习能帮助你保持稳定的情绪</p>
          </div>
          <div className="insight">
            <span className="insight-icon">🌙</span>
            <p>建议每周安排两次冥想，有助于情绪管理</p>
          </div>
        </div>
      </div>
    </div>
  );

  // 统计视图
  const renderStatsView = () => (
    <div className="stats-view">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{memories.length}</div>
          <div className="stat-label">总记忆数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.floor(memories.reduce((sum, m) => sum + m.duration, 0) / 60)}h</div>
          <div className="stat-label">总使用时长</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{new Set(memories.map(m => m.app)).size}</div>
          <div className="stat-label">使用应用数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{memories.length > 0 ? (memories.reduce((sum, m) => sum + m.tags.length, 0) / memories.length).toFixed(1) : 0}</div>
          <div className="stat-label">平均标签数</div>
        </div>
      </div>

      <div className="app-usage">
        <h3>应用使用统计</h3>
        <div className="usage-list">
          {[...new Set(memories.map(m => m.app))].map(app => {
            const count = memories.filter(m => m.app === app).length;
            return (
              <div key={app} className="usage-item">
                <span className="app-name">{app}</span>
                <div className="usage-bar">
                  <div 
                    className="usage-fill"
                    style={{ width: `${(count / memories.length) * 100}%` }}
                  ></div>
                </div>
                <span className="usage-count">{count}次</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-heatmap">
        <h3>活跃日历</h3>
        <div className="heatmap-placeholder">
          <p>📅 活动热力图</p>
          <p style={{ fontSize: '12px', color: '#999' }}>显示你的使用活跃度</p>
        </div>
      </div>
    </div>
  );

  // 获取相对时间
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const days = Math.floor(seconds / 86400);
    if (days > 0) return `${days}天前`;
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) return `${hours}小时前`;
    return '最近';
  };

  return (
    <div className="memory-library-page">
      <header className="library-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1>📚 记忆图书馆</h1>
      </header>

      <div className="library-toolbar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索记忆..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${selectedEmotion === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedEmotion('all')}
          >
            全部
          </button>
          {Object.entries(emotions).map(([key, emotion]) => (
            <button
              key={key}
              className={`filter-btn emotion-filter ${selectedEmotion === key ? 'active' : ''}`}
              onClick={() => setSelectedEmotion(key)}
              style={{ 
                borderColor: emotion.color,
                color: selectedEmotion === key ? emotion.color : '#999'
              }}
            >
              {emotion.emoji} {emotion.label}
            </button>
          ))}
        </div>

        <div className="view-modes">
          <button 
            className={`mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            📜 时间线
          </button>
          <button 
            className={`mode-btn ${viewMode === 'emotion' ? 'active' : ''}`}
            onClick={() => setViewMode('emotion')}
          >
            🎨 情绪
          </button>
          <button 
            className={`mode-btn ${viewMode === 'stats' ? 'active' : ''}`}
            onClick={() => setViewMode('stats')}
          >
            📊 统计
          </button>
        </div>
      </div>

      <main className="library-main">
        {isLoading ? (
          <div className="loading-state">加载中...</div>
        ) : (
          <>
            {viewMode === 'timeline' && renderTimelineView()}
            {viewMode === 'emotion' && renderEmotionView()}
            {viewMode === 'stats' && renderStatsView()}
          </>
        )}
      </main>
    </div>
  );
};

export default MemoryLibraryPage;
