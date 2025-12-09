// HealingStationPage 更新版本 - 集成 WebSocket 实时聊天
import React, { useState, useEffect, useRef } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import apiService from '../services/apiService';
import '../styles/HealingStationPage.css';

const HealingStationPage = () => {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const [roomId, setRoomId] = useState('healing-station-' + (localStorage.getItem('userId') || 'default'));
  
  // WebSocket 连接
  const {
    connected,
    sendMessage: sendWSMessage,
    onMessage,
    joinRoom,
    leaveRoom,
    sendNotification,
    updateStatus
  } = useWebSocket({
    userId: localStorage.getItem('userId'),
    username: localStorage.getItem('username'),
    onConnect: () => console.log('Connected to healing station'),
    onDisconnect: () => console.log('Disconnected from healing station')
  });

  // 初始化
  useEffect(() => {
    loadChatHistory();
    if (connected) {
      joinRoom(roomId, 'healing');
    }

    return () => {
      if (connected) {
        leaveRoom(roomId);
      }
    };
  }, [connected]);

  // 监听实时消息
  useEffect(() => {
    const unsubscribe = onMessage((messageData) => {
      if (messageData.userId !== localStorage.getItem('userId')) {
        // 只显示其他用户的消息
        setMessages(prev => [...prev, {
          ...messageData,
          isBot: true,
          timestamp: new Date(messageData.timestamp)
        }]);
      }
    });

    return unsubscribe;
  }, [onMessage]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载聊天历史
  const loadChatHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const savedHistory = localStorage.getItem(`healingChat_${userId}`);
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setMessages(history);
        setChatHistory(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // 发送聊天消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // 添加用户消息
    const userMessage = {
      id: `msg_${Date.now()}`,
      text: inputText,
      isBot: false,
      emotion: currentEmotion,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // 发送到 WebSocket (如果连接)
    if (connected) {
      sendWSMessage(roomId, inputText, currentEmotion);
    }

    // 分析情绪
    try {
      setIsLoading(true);
      const emotionResult = await apiService.analyzeEmotion(inputText);
      setCurrentEmotion(emotionResult.emotion || 'neutral');

      // 模拟AI响应 (实际应该调用后端API)
      const responses = {
        happy: "太好了！😊 看起来你现在心情很好。你可以与朋友分享这份喜悦，或者听一些欢快的音乐来延续这种快乐。",
        sad: "我感受到你的难过。💙 有时候我们都会有情绪低落的时候。也许听一些治愈的音乐或者冥想会对你有帮助。",
        anxious: "我感觉到你有些焦虑。🌬️ 深呼吸是一个很好的开始。让我推荐一个冥想课程来帮助你放松。",
        calm: "很棒，你现在很平静。☮️ 保持这种状态吧。我们可以一起冥想或者记录一下你的感受。",
        neutral: "你好呀！👋 今天怎么样？告诉我你现在的感受吧。"
      };

      const response = responses[emotionResult.emotion] || responses['neutral'];

      const botMessage = {
        id: `msg_${Date.now() + 1}`,
        text: response,
        isBot: true,
        emotion: emotionResult.emotion,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // 保存聊天历史
      const updatedHistory = [...messages, userMessage, botMessage];
      const userId = localStorage.getItem('userId');
      localStorage.setItem(`healingChat_${userId}`, JSON.stringify(updatedHistory));
      setChatHistory(updatedHistory);

      // 更新状态为 busy
      updateStatus('busy');

    } catch (error) {
      console.error('Error analyzing emotion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 治愈音乐列表
  const healingMusics = [
    { id: 1, name: '雨声', src: '/audio/rain.mp3', duration: '3:45' },
    { id: 2, name: '森林', src: '/audio/forest.mp3', duration: '4:20' },
    { id: 3, name: '海洋', src: '/audio/ocean.mp3', duration: '3:50' },
    { id: 4, name: '钢琴', src: '/audio/piano.mp3', duration: '5:10' },
    { id: 5, name: '冥想', src: '/audio/meditation.mp3', duration: '7:30' }
  ];

  // 冥想课程
  const meditations = [
    { id: 1, name: '放松冥想', duration: '3分钟', description: '快速放松，舒缓压力' },
    { id: 2, name: '深度冥想', duration: '5分钟', description: '深入内心，寻找平静' },
    { id: 3, name: '睡眠冥想', duration: '7分钟', description: '准备睡眠，放松身心' },
    { id: 4, name: '晨间冥想', duration: '10分钟', description: '开启新的一天，充满能量' }
  ];

  // 播放治愈音乐
  const playHealingMusic = async (music) => {
    try {
      // 通知房间内的其他用户
      if (connected) {
        sendNotification(null, 'info', '音乐分享', `${localStorage.getItem('username')} 正在播放: ${music.name}`, {
          type: 'play_music',
          musicId: music.id
        });
      }

      console.log('Playing:', music.name);
      // 实际播放逻辑
    } catch (error) {
      console.error('Error playing music:', error);
    }
  };

  // 开始冥想
  const startMeditation = (meditation) => {
    console.log('Starting meditation:', meditation.name);
    // 显示冥想引导界面
    setMode('meditation-detail');
  };

  // 保存日记
  const saveDiary = async (content) => {
    try {
      const userId = localStorage.getItem('userId');
      await apiService.saveMemory({
        userId,
        type: 'diary',
        content,
        emotion: currentEmotion,
        app: 'HealingStation',
        timestamp: new Date()
      });

      // 发送通知给房间
      if (connected) {
        sendNotification(null, 'success', '日记已保存', `我刚刚记录了今天的感受`, {
          type: 'diary_saved'
        });
      }

      alert('日记已保存');
    } catch (error) {
      console.error('Error saving diary:', error);
    }
  };

  return (
    <div className="healing-station-page">
      <div className="healing-container">
        {/* 模式选择 */}
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
          >
            💬 AI聊天
          </button>
          <button
            className={`mode-btn ${mode === 'music' ? 'active' : ''}`}
            onClick={() => setMode('music')}
          >
            🎵 治愈音乐
          </button>
          <button
            className={`mode-btn ${mode === 'meditation' ? 'active' : ''}`}
            onClick={() => setMode('meditation')}
          >
            🧘 冥想引导
          </button>
          <button
            className={`mode-btn ${mode === 'diary' ? 'active' : ''}`}
            onClick={() => setMode('diary')}
          >
            📝 情绪日记
          </button>
        </div>

        {/* 聊天模式 */}
        {mode === 'chat' && (
          <div className="chat-mode">
            <div className="chat-container">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🌸</div>
                    <p>你好，欢迎来到疗愈站。告诉我你现在的感受吧。</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`message ${msg.isBot ? 'bot' : 'user'}`}>
                      <div className="message-avatar">
                        {msg.isBot ? '🤖' : '👤'}
                      </div>
                      <div className="message-content">
                        <div className="message-text">{msg.text}</div>
                        <div className="message-time">
                          {msg.timestamp?.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="message bot">
                    <div className="message-avatar">🤖</div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-group">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="分享你的想法..."
                  className="chat-input"
                />
                <button onClick={handleSendMessage} className="send-btn">
                  发送
                </button>
              </div>

              <div className="emotion-indicator">
                当前情绪: <span className={`emotion ${currentEmotion}`}>{currentEmotion}</span>
                <span className={`status ${connected ? 'online' : 'offline'}`}>
                  {connected ? '✓ 已连接' : '✗ 未连接'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 治愈音乐模式 */}
        {mode === 'music' && (
          <div className="music-mode">
            <h2>治愈音乐库</h2>
            <div className="music-grid">
              {healingMusics.map(music => (
                <div key={music.id} className="music-card" onClick={() => playHealingMusic(music)}>
                  <div className="music-icon">🎵</div>
                  <div className="music-info">
                    <h3>{music.name}</h3>
                    <p>{music.duration}</p>
                  </div>
                  <button className="play-btn">▶ 播放</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 冥想模式 */}
        {mode === 'meditation' && (
          <div className="meditation-mode">
            <h2>冥想课程</h2>
            <div className="meditation-grid">
              {meditations.map(med => (
                <div key={med.id} className="meditation-card" onClick={() => startMeditation(med)}>
                  <div className="meditation-icon">✨</div>
                  <div className="meditation-info">
                    <h3>{med.name}</h3>
                    <p>{med.duration}</p>
                    <p className="description">{med.description}</p>
                  </div>
                  <button className="start-btn">开始</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 日记模式 */}
        {mode === 'diary' && (
          <div className="diary-mode">
            <h2>情绪日记</h2>
            <textarea
              placeholder="写下你今天的感受..."
              className="diary-textarea"
              onBlur={(e) => saveDiary(e.target.value)}
            />
            <div className="diary-history">
              <h3>最近的日记</h3>
              {chatHistory.slice(-5).map(item => (
                <div key={item.id} className="diary-item">
                  <div className="diary-time">{item.timestamp?.toLocaleDateString()}</div>
                  <div className="diary-text">{item.text?.substring(0, 100)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealingStationPage;
