/**
 * 声音疗愈站页面
 * 文件: frontend-web/src/pages/HealingStationPage.jsx
 * 功能: AI陪伴对话、治愈音乐、冥想引导、情绪日记
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import '../styles/HealingStationPage.css';

const HealingStationPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('chat'); // chat, music, meditation, diary
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState('🌙');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    const username = localStorage.getItem('username') || '亲爱的朋友';
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `你好，${username}。我是你的声音疗愈师。今天有什么想跟我说的吗？`,
        timestamp: new Date()
      }
    ]);
  }, []);

  // 更新emoji
  useEffect(() => {
    const emojis = ['🌙', '⭐', '💫', '✨', '🌟'];
    const interval = setInterval(() => {
      setCurrentEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 发送聊天消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 调用AI API获取回复
      const response = await apiService.analyzeEmotion({
        text: inputText,
        type: 'text',
        context: 'healing',
        userId: localStorage.getItem('userId')
      });

      // 模拟AI回复（实际应该从后端获取）
      const healingResponses = [
        '我听到你的声音了。告诉我更多关于这种感受的事情吧。',
        '这是很正常的感受。你想到过什么可能有帮助的方法吗？',
        '我很感谢你的信任。让我们一起寻找平静。',
        '你的感受很重要。现在，深呼一口气。',
        '我在这里陪伴你。你会度过这一刻的。'
      ];

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: healingResponses[Math.floor(Math.random() * healingResponses.length)],
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('获取回复失败:', error);
      setIsLoading(false);
    }
  };

  // 播放治愈音乐
  const playHealingMusic = (musicType) => {
    const musicList = {
      rain: { name: '雨声', url: 'audio/rain.mp3' },
      forest: { name: '森林鸟鸣', url: 'audio/forest.mp3' },
      ocean: { name: '海浪声', url: 'audio/ocean.mp3' },
      piano: { name: '舒缓钢琴', url: 'audio/piano.mp3' },
      meditation: { name: '冥想音乐', url: 'audio/meditation.mp3' }
    };

    const music = musicList[musicType];
    if (music) {
      const audio = new Audio(music.url);
      audio.play().catch(err => console.error('播放失败:', err));
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'system',
        content: `🎵 正在播放: ${music.name}`,
        timestamp: new Date()
      }]);
    }
  };

  // 开始冥想引导
  const startMeditation = async () => {
    setIsLoading(true);
    
    const meditationGuide = `
    🧘 3分钟冥想引导
    
    找一个舒适的位置坐下。
    闭上眼睛，深吸一口气。
    
    让我们开始：
    
    1. 缓慢地吸气... (4秒)
       屏住呼吸... (4秒)
       慢慢呼气... (4秒)
    
    2. 再重复这个过程...
       感受你的身体...
       感受当下...
    
    3. 当思绪漂浮时，温柔地将注意力带回你的呼吸。
       没有判断，没有压力。
       只是呼吸，只是存在。
    
    现在，慢慢睁开眼睛。
    你已经度过了很好的一刻。
    `;

    setMessages(prev => [...prev, {
      id: prev.length + 1,
      type: 'bot',
      content: meditationGuide,
      timestamp: new Date()
    }]);

    setIsLoading(false);
  };

  // 打开情绪日记
  const openDiary = () => {
    setMode('diary');
  };

  // 保存日记
  const saveDiary = async (content) => {
    try {
      await apiService.saveMemory({
        type: 'healing_diary',
        content: content,
        emotionType: 'reflective',
        userId: localStorage.getItem('userId')
      });
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'system',
        content: '📝 你的日记已保存到记忆库',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('保存日记失败:', error);
    }
  };

  // 聊天模式界面
  const renderChatMode = () => (
    <div className="healing-chat-container">
      <div className="chat-header">
        <h2>{currentEmoji} 疗愈对话</h2>
        <p>我在这里倾听你的声音</p>
      </div>

      <div className="messages-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message message-${msg.type}`}>
            <div className="message-bubble">
              <p>{msg.content}</p>
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message message-bot">
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="说出你的想法..."
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !inputText.trim()}
          className="send-button"
        >
          💬 发送
        </button>
      </div>
    </div>
  );

  // 音乐模式界面
  const renderMusicMode = () => (
    <div className="healing-music-container">
      <div className="music-header">
        <h2>🎵 治愈音乐库</h2>
        <p>选择一首来陪伴你</p>
      </div>

      <div className="music-grid">
        <div className="music-card" onClick={() => playHealingMusic('rain')}>
          <div className="music-icon">🌧️</div>
          <h3>雨声</h3>
          <p>柔和的雨声</p>
        </div>
        <div className="music-card" onClick={() => playHealingMusic('forest')}>
          <div className="music-icon">🌲</div>
          <h3>森林鸟鸣</h3>
          <p>自然的交响</p>
        </div>
        <div className="music-card" onClick={() => playHealingMusic('ocean')}>
          <div className="music-icon">🌊</div>
          <h3>海浪声</h3>
          <p>大海的拥抱</p>
        </div>
        <div className="music-card" onClick={() => playHealingMusic('piano')}>
          <div className="music-icon">🎹</div>
          <h3>舒缓钢琴</h3>
          <p>古典的宁静</p>
        </div>
        <div className="music-card" onClick={() => playHealingMusic('meditation')}>
          <div className="music-icon">🔔</div>
          <h3>冥想音乐</h3>
          <p>纯净的心灵</p>
        </div>
      </div>
    </div>
  );

  // 冥想模式界面
  const renderMeditationMode = () => (
    <div className="healing-meditation-container">
      <div className="meditation-header">
        <h2>🧘 冥想引导</h2>
        <p>放松身心，回归当下</p>
      </div>

      <div className="meditation-content">
        <div className="guided-meditations">
          <button className="meditation-btn" onClick={startMeditation}>
            <span className="meditation-duration">3分钟</span>
            <span className="meditation-title">基础呼吸冥想</span>
          </button>
          <button className="meditation-btn">
            <span className="meditation-duration">5分钟</span>
            <span className="meditation-title">身体扫描冥想</span>
          </button>
          <button className="meditation-btn">
            <span className="meditation-duration">7分钟</span>
            <span className="meditation-title">心境平和冥想</span>
          </button>
          <button className="meditation-btn">
            <span className="meditation-duration">10分钟</span>
            <span className="meditation-title">深度放松冥想</span>
          </button>
        </div>

        <div className="meditation-tips">
          <h3>冥想提示：</h3>
          <ul>
            <li>选择一个安静舒适的地方</li>
            <li>穿着宽松舒适的衣服</li>
            <li>关闭手机和其他干扰</li>
            <li>坚持每日练习以获得最佳效果</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // 日记模式界面
  const renderDiaryMode = () => (
    <div className="healing-diary-container">
      <div className="diary-header">
        <h2>📝 情绪日记</h2>
        <p>记录你的感受和想法</p>
      </div>

      <div className="diary-form">
        <textarea 
          placeholder="写下你现在的心情、想法或任何你想记录的事情..."
          rows="10"
          className="diary-textarea"
        />
        <button 
          className="save-diary-btn"
          onClick={(e) => {
            const content = e.target.parentElement.querySelector('.diary-textarea').value;
            if (content.trim()) {
              saveDiary(content);
              e.target.parentElement.querySelector('.diary-textarea').value = '';
            }
          }}
        >
          💾 保存日记
        </button>
      </div>

      <div className="diary-history">
        <h3>最近的日记：</h3>
        <div className="diary-list">
          {messages
            .filter(m => m.type === 'system' && m.content.includes('日记'))
            .map(msg => (
              <div key={msg.id} className="diary-item">
                <span className="diary-date">{msg.timestamp.toLocaleDateString()}</span>
                <span className="diary-preview">{msg.content}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );

  return (
    <div className="healing-station-page">
      <header className="healing-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1>🌙 声音疗愈站</h1>
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
          >
            💬 聊天
          </button>
          <button 
            className={`mode-btn ${mode === 'music' ? 'active' : ''}`}
            onClick={() => setMode('music')}
          >
            🎵 音乐
          </button>
          <button 
            className={`mode-btn ${mode === 'meditation' ? 'active' : ''}`}
            onClick={() => setMode('meditation')}
          >
            🧘 冥想
          </button>
          <button 
            className={`mode-btn ${mode === 'diary' ? 'active' : ''}`}
            onClick={() => setMode('diary')}
          >
            📝 日记
          </button>
        </div>
      </header>

      <main className="healing-main">
        {mode === 'chat' && renderChatMode()}
        {mode === 'music' && renderMusicMode()}
        {mode === 'meditation' && renderMeditationMode()}
        {mode === 'diary' && renderDiaryMode()}
      </main>
    </div>
  );
};

export default HealingStationPage;
