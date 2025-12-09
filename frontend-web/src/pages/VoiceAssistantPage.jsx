/**
 * 个人声音助手页面
 * 文件: frontend-web/src/pages/VoiceAssistantPage.jsx
 * 功能: 语音对话、新闻播报、日程提醒、灵感记录
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import '../styles/VoiceAssistantPage.css';

const VoiceAssistantPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('chat'); // chat, news, schedule, ideas
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState('');
  const mediaRecorderRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    const username = localStorage.getItem('username') || '用户';
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `你好，${username}！我是你的个人声音助手。有什么我可以帮你的吗？`,
        timestamp: new Date()
      }
    ]);

    // 初始化日程
    const mockSchedule = [
      { id: 1, title: '工作会议', time: '09:00', duration: 60 },
      { id: 2, title: '午餐', time: '12:30', duration: 60 },
      { id: 3, title: '冥想时间', time: '15:00', duration: 20 }
    ];
    setSchedule(mockSchedule);
  }, []);

  // 开始语音输入
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceInput(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('麦克风访问失败:', error);
    }
  };

  // 停止语音输入
  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // 处理语音输入
  const processVoiceInput = async (blob) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioData = reader.result.split(',')[1];
        
        // 调用API进行语音识别和回复
        const result = await apiService.analyzeEmotion({
          audio: audioData,
          type: 'audio',
          context: 'voice_assistant',
          userId: localStorage.getItem('userId')
        });

        // 模拟语音转文本
        setInputText('（语音识别中...）');
        
        // 发送消息
        setTimeout(() => {
          handleSendMessage();
        }, 500);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('处理语音失败:', error);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 调用AI API获取回复
      const responses = [
        '好的，我为你做了笔记。还有其他事吗？',
        '明白了。这对你很重要吗？',
        '很有意思。你想怎么处理这个？',
        '我理解你的想法。让我帮你分析一下。',
        '这是个很好的主意。你打算什么时候开始？'
      ];

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: responses[Math.floor(Math.random() * responses.length)],
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

  // 聊天模式
  const renderChatMode = () => (
    <div className="assistant-chat-container">
      <div className="chat-header">
        <h2>💬 语音助手</h2>
        <p>和我聊天吧</p>
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
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="说出你的想法或输入内容..."
            disabled={isLoading}
          />
          {!isListening ? (
            <button 
              onClick={startListening}
              className="voice-btn"
              title="点击说话"
            >
              🎤
            </button>
          ) : (
            <button 
              onClick={stopListening}
              className="voice-btn active"
              title="停止说话"
            >
              ⏹️
            </button>
          )}
          <button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="send-button"
          >
            📤 发送
          </button>
        </div>
      </div>
    </div>
  );

  // 新闻播报模式
  const renderNewsMode = () => (
    <div className="assistant-news-container">
      <div className="news-header">
        <h2>📰 每日新闻</h2>
        <p>获取最新资讯</p>
      </div>

      <div className="news-categories">
        <button className="news-cat-btn active">🔥 热点</button>
        <button className="news-cat-btn">💼 商业</button>
        <button className="news-cat-btn">🔬 科技</button>
        <button className="news-cat-btn">⚽ 体育</button>
        <button className="news-cat-btn">🎬 娱乐</button>
      </div>

      <div className="news-list">
        <div className="news-item">
          <div className="news-icon">📱</div>
          <div className="news-content">
            <h3>最新AI技术突破</h3>
            <p>新一代深学习模型提升效率50%。研究者们今天发布了最新的技术进展...</p>
            <div className="news-meta">
              <span>2小时前</span>
              <span>来自: TechNews</span>
            </div>
          </div>
          <button className="news-listen-btn">👂 播报</button>
        </div>

        <div className="news-item">
          <div className="news-icon">💰</div>
          <div className="news-content">
            <h3>市场趋势分析</h3>
            <p>股市今日上涨，多个科技公司创新高。投资者对未来持乐观态度...</p>
            <div className="news-meta">
              <span>3小时前</span>
              <span>来自: Finance</span>
            </div>
          </div>
          <button className="news-listen-btn">👂 播报</button>
        </div>

        <div className="news-item">
          <div className="news-icon">🌍</div>
          <div className="news-content">
            <h3>环保倡议获国际认可</h3>
            <p>联合国表扬了该国在可再生能源方面的努力和成果...</p>
            <div className="news-meta">
              <span>4小时前</span>
              <span>来自: GlobalNews</span>
            </div>
          </div>
          <button className="news-listen-btn">👂 播报</button>
        </div>
      </div>

      <button className="read-more-btn">更新新闻 ↻</button>
    </div>
  );

  // 日程提醒模式
  const renderScheduleMode = () => (
    <div className="assistant-schedule-container">
      <div className="schedule-header">
        <h2>📅 日程安排</h2>
        <p>管理你的日常计划</p>
      </div>

      <div className="date-selector">
        <button className="date-btn">← 昨天</button>
        <span className="current-date">{new Date().toLocaleDateString('zh-CN')}</span>
        <button className="date-btn">明天 →</button>
      </div>

      <div className="schedule-list">
        {schedule.length > 0 ? (
          schedule.map(item => (
            <div key={item.id} className="schedule-item">
              <div className="time-block">
                <span className="time">{item.time}</span>
                <span className="duration">{item.duration}分钟</span>
              </div>
              <div className="event-info">
                <h3>{item.title}</h3>
                <p>日程已添加</p>
              </div>
              <button className="delete-btn">✕</button>
            </div>
          ))
        ) : (
          <div className="empty-schedule">
            <p>今天没有日程安排</p>
            <p className="hint">添加新的日程吧</p>
          </div>
        )}
      </div>

      <div className="add-schedule">
        <h3>+ 添加新日程</h3>
        <form className="schedule-form">
          <input 
            type="text"
            placeholder="事项标题"
            className="input-field"
          />
          <input 
            type="time"
            placeholder="时间"
            className="input-field"
          />
          <input 
            type="number"
            placeholder="时长(分钟)"
            className="input-field"
          />
          <button type="submit" className="add-btn">添加</button>
        </form>
      </div>
    </div>
  );

  // 灵感记录模式
  const renderIdeasMode = () => (
    <div className="assistant-ideas-container">
      <div className="ideas-header">
        <h2>💡 灵感记录</h2>
        <p>捕捉每个创意时刻</p>
      </div>

      <div className="add-idea-section">
        <textarea 
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="记录你的灵感..."
          className="idea-textarea"
        />
        <div className="idea-actions">
          <button 
            className="record-idea-btn voice"
            onClick={startListening}
            disabled={isListening}
          >
            🎤 语音记录
          </button>
          {isListening && (
            <button 
              className="record-idea-btn stop"
              onClick={stopListening}
            >
              ⏹️ 停止
            </button>
          )}
          <button 
            className="save-idea-btn"
            onClick={async () => {
              if (newIdea.trim()) {
                const idea = {
                  id: ideas.length + 1,
                  content: newIdea,
                  timestamp: new Date(),
                  tags: [],
                  starred: false
                };
                setIdeas(prev => [idea, ...prev]);
                setNewIdea('');
                
                // 保存到后端
                try {
                  await apiService.saveMemory({
                    type: 'voice_idea',
                    content: newIdea,
                    userId: localStorage.getItem('userId')
                  });
                } catch (error) {
                  console.error('保存灵感失败:', error);
                }
              }
            }}
          >
            💾 保存灵感
          </button>
        </div>
      </div>

      <div className="ideas-list">
        <h3>我的灵感库 ({ideas.length})</h3>
        {ideas.length > 0 ? (
          <div className="idea-cards">
            {ideas.map(idea => (
              <div key={idea.id} className="idea-card">
                <button 
                  className={`star-btn ${idea.starred ? 'starred' : ''}`}
                  onClick={() => {
                    setIdeas(prev => 
                      prev.map(i => 
                        i.id === idea.id ? { ...i, starred: !i.starred } : i
                      )
                    );
                  }}
                >
                  ⭐
                </button>
                <p className="idea-content">{idea.content}</p>
                <span className="idea-date">
                  {idea.timestamp.toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-ideas">
            <p>还没有记录灵感呢</p>
            <p className="hint">开始记录你的创意吧</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="voice-assistant-page">
      <header className="assistant-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1>🤖 个人声音助手</h1>
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
            onClick={() => setMode('chat')}
          >
            💬 聊天
          </button>
          <button 
            className={`mode-btn ${mode === 'news' ? 'active' : ''}`}
            onClick={() => setMode('news')}
          >
            📰 新闻
          </button>
          <button 
            className={`mode-btn ${mode === 'schedule' ? 'active' : ''}`}
            onClick={() => setMode('schedule')}
          >
            📅 日程
          </button>
          <button 
            className={`mode-btn ${mode === 'ideas' ? 'active' : ''}`}
            onClick={() => setMode('ideas')}
          >
            💡 灵感
          </button>
        </div>
      </header>

      <main className="assistant-main">
        {mode === 'chat' && renderChatMode()}
        {mode === 'news' && renderNewsMode()}
        {mode === 'schedule' && renderScheduleMode()}
        {mode === 'ideas' && renderIdeasMode()}
      </main>
    </div>
  );
};

export default VoiceAssistantPage;
