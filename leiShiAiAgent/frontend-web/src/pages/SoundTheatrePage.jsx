/**
 * 声音剧场页面
 * 文件: frontend-web/src/pages/SoundTheatrePage.jsx
 * 功能: AI播客、深夜电台、有声书、知识漫谈
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import '../styles/SoundTheatrePage.css';

const SoundTheatrePage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('podcast'); // podcast, radio, audiobook, talk
  const [currentContent, setCurrentContent] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  // 播客数据
  const podcastList = [
    {
      id: 1,
      title: '生活的艺术',
      description: '探讨如何在日常中找到美和意义',
      duration: '32:45',
      image: '🎙️',
      category: 'lifestyle'
    },
    {
      id: 2,
      title: '心理学小课堂',
      description: '了解自己的心理，管理情绪',
      duration: '28:30',
      image: '🧠',
      category: 'psychology'
    },
    {
      id: 3,
      title: '音乐的秘密',
      description: '音乐如何影响我们的心境',
      duration: '25:15',
      image: '🎵',
      category: 'music'
    },
    {
      id: 4,
      title: '冥想故事',
      description: '用故事引导你进入深度放松',
      duration: '20:00',
      image: '📖',
      category: 'meditation'
    }
  ];

  // 电台节目
  const radioStations = [
    {
      id: 1,
      name: '深夜漫步电台',
      description: '午夜的温柔陪伴',
      icon: '🌙',
      mood: 'calm'
    },
    {
      id: 2,
      name: '晨曦唤醒电台',
      description: '美好清晨的开始',
      icon: '🌅',
      mood: 'energetic'
    },
    {
      id: 3,
      name: '工作专注电台',
      description: '提升专注力的背景音乐',
      icon: '💼',
      mood: 'focused'
    },
    {
      id: 4,
      name: '思考漫谈电台',
      description: '深度思考的伴侣',
      icon: '💭',
      mood: 'reflective'
    }
  ];

  // 有声书
  const audiobooks = [
    {
      id: 1,
      title: '小王子',
      author: '圣埃克苏佩里',
      cover: '👑',
      progress: 45,
      chapters: 27,
      currentChapter: 13
    },
    {
      id: 2,
      title: '活着',
      author: '余华',
      cover: '📚',
      progress: 20,
      chapters: 24,
      currentChapter: 5
    },
    {
      id: 3,
      title: '人生的四季',
      author: '李善友',
      cover: '🌍',
      progress: 80,
      chapters: 18,
      currentChapter: 15
    }
  ];

  // 知识漫谈话题
  const talkTopics = [
    {
      id: 1,
      title: '如何管理情绪',
      speakers: '心理咨询师 Amy',
      duration: '18:30',
      icon: '😊',
      rating: 4.8
    },
    {
      id: 2,
      title: '创意思维工坊',
      speakers: '创意总监 Mark',
      duration: '22:15',
      icon: '💡',
      rating: 4.9
    },
    {
      id: 3,
      title: '冥想与正念生活',
      speakers: '冥想导师 Zhang',
      duration: '25:00',
      icon: '🧘',
      rating: 4.7
    },
    {
      id: 4,
      title: '音乐疗法的科学',
      speakers: '音乐治疗师 Lisa',
      duration: '30:45',
      icon: '🎼',
      rating: 4.8
    }
  ];

  // 播放内容
  const playContent = (content) => {
    setCurrentContent(content);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  // 暂停播放
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 更新播放进度
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      if (duration) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  // 播客模式
  const renderPodcastMode = () => (
    <div className="podcast-container">
      <div className="podcast-header">
        <h2>🎙️ AI播客</h2>
        <p>深度话题，精彩讨论</p>
      </div>

      <div className="podcast-grid">
        {podcastList.map(podcast => (
          <div key={podcast.id} className="podcast-card">
            <div className="podcast-cover">{podcast.image}</div>
            <h3>{podcast.title}</h3>
            <p>{podcast.description}</p>
            <div className="podcast-meta">
              <span className="duration">⏱️ {podcast.duration}</span>
              <button 
                className="play-btn"
                onClick={() => playContent(podcast)}
              >
                ▶️ 播放
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 电台模式
  const renderRadioMode = () => (
    <div className="radio-container">
      <div className="radio-header">
        <h2>📻 深夜电台</h2>
        <p>24小时陪伴你</p>
      </div>

      <div className="radio-player">
        <div className="radio-display">
          <div className="radio-frequency">
            {currentContent ? `${currentContent.name}` : '选择电台'}
          </div>
          <div className="radio-wave">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
        </div>

        {currentContent && (
          <div className="radio-info">
            <p className="radio-name">{currentContent.name}</p>
            <p className="radio-desc">{currentContent.description}</p>
          </div>
        )}
      </div>

      <div className="radio-stations">
        {radioStations.map(station => (
          <div 
            key={station.id} 
            className={`radio-station ${currentContent?.id === station.id ? 'active' : ''}`}
            onClick={() => playContent(station)}
          >
            <span className="station-icon">{station.icon}</span>
            <div className="station-info">
              <h4>{station.name}</h4>
              <p>{station.description}</p>
            </div>
            <span className="station-mood">{station.mood}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 有声书模式
  const renderAudiobookMode = () => (
    <div className="audiobook-container">
      <div className="audiobook-header">
        <h2>📖 有声书馆</h2>
        <p>用声音阅读，享受故事</p>
      </div>

      <div className="audiobook-list">
        {audiobooks.map(book => (
          <div key={book.id} className="audiobook-item">
            <div className="book-cover">{book.cover}</div>
            <div className="book-info">
              <h3>{book.title}</h3>
              <p className="author">作者: {book.author}</p>
              <div className="book-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${book.progress}%` }}></div>
                </div>
                <span className="progress-text">
                  {book.currentChapter}/{book.chapters} 章
                </span>
              </div>
            </div>
            <button 
              className="read-btn"
              onClick={() => playContent(book)}
            >
              📖 继续
            </button>
          </div>
        ))}
      </div>

      <div className="add-book-section">
        <h3>+ 添加有声书</h3>
        <p>搜索你喜欢的书籍</p>
        <input 
          type="text"
          placeholder="输入书名或作者..."
          className="search-input"
        />
      </div>
    </div>
  );

  // 知识漫谈模式
  const renderTalkMode = () => (
    <div className="talk-container">
      <div className="talk-header">
        <h2>💬 知识漫谈</h2>
        <p>与专家进行深度对话</p>
      </div>

      <div className="talk-grid">
        {talkTopics.map(talk => (
          <div key={talk.id} className="talk-card">
            <div className="talk-cover">{talk.icon}</div>
            <h3>{talk.title}</h3>
            <p className="speakers">讲者: {talk.speakers}</p>
            <div className="talk-meta">
              <span className="duration">⏱️ {talk.duration}</span>
              <span className="rating">⭐ {talk.rating}</span>
            </div>
            <button 
              className="listen-btn"
              onClick={() => playContent(talk)}
            >
              👂 收听
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="sound-theatre-page">
      <header className="theatre-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1>🎬 声音剧场</h1>
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'podcast' ? 'active' : ''}`}
            onClick={() => setMode('podcast')}
          >
            🎙️ 播客
          </button>
          <button 
            className={`mode-btn ${mode === 'radio' ? 'active' : ''}`}
            onClick={() => setMode('radio')}
          >
            📻 电台
          </button>
          <button 
            className={`mode-btn ${mode === 'audiobook' ? 'active' : ''}`}
            onClick={() => setMode('audiobook')}
          >
            📖 有声书
          </button>
          <button 
            className={`mode-btn ${mode === 'talk' ? 'active' : ''}`}
            onClick={() => setMode('talk')}
          >
            💬 漫谈
          </button>
        </div>
      </header>

      <main className="theatre-main">
        {mode === 'podcast' && renderPodcastMode()}
        {mode === 'radio' && renderRadioMode()}
        {mode === 'audiobook' && renderAudiobookMode()}
        {mode === 'talk' && renderTalkMode()}
      </main>

      {/* 播放器 */}
      {currentContent && (
        <footer className="audio-player">
          <div className="player-content">
            <span className="player-title">{currentContent.title || currentContent.name}</span>
            <div className="player-controls">
              <button onClick={togglePlayPause} className="play-pause-btn">
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <div className="progress-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 
                        (e.target.value / 100) * audioRef.current.duration;
                    }
                  }}
                  className="progress-slider"
                />
              </div>
            </div>
          </div>
          <audio 
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
        </footer>
      )}
    </div>
  );
};

export default SoundTheatrePage;
