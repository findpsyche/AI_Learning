/**
 * Node.js 主服务器
 * 文件: backend/nodejs-server/src/app.js
 * 功能: WebSocket实时通信、REST API、Prompt引擎
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const WebSocketService = require('./services/websocketService');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 初始化 WebSocket 服务
const wsService = new WebSocketService(server);

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// 配置
const config = {
  port: process.env.PORT || 3000,
  fastApiUrl: process.env.FASTAPI_URL || 'http://localhost:8000',
  openaiApiKey: process.env.OPENAI_API_KEY
};
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../../backend-ai/soundscape.db'); // 指向Python生成的DB
// OpenAI服务
const OpenAIService = {
  async chat(messages, options = {}) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: options.model || 'gpt-4-turbo-preview',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${config.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  async generateAudio(text, options = {}) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: text,
          voice: options.voice || 'alloy',
          speed: options.speed || 1.0
        },
        {
          headers: {
            'Authorization': `Bearer ${config.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      return Buffer.from(response.data).toString('base64');
    } catch (error) {
      console.error('Audio Generation Error:', error);
      throw error;
    }
  }
};
// 1. 获取用户信息 (用于首页问候)
app.get('/api/user/profile', (req, res) => {
    // 简化版：默认获取第一个用户，实际需对接登录系统
    db.get("SELECT username FROM users LIMIT 1", [], (err, row) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({ 
            username: row ? row.username : "旅人",
            greeting: `今天也很棒勒！` // 个性化后缀
        });
    });
});

// 2. 获取所有 DApps (用于手动搜索)
app.get('/api/dapps', (req, res) => {
    const query = req.query.q;
    let sql = "SELECT * FROM dapps";
    let params = [];
    
    if (query) {
        sql += " WHERE name LIKE ? OR description LIKE ?";
        params = [`%${query}%`, `%${query}%`];
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// 3. 根据情绪推荐 DApps
app.post('/api/dapps/recommend', (req, res) => {
    const { emotion } = req.body; // e.g., 'sad', 'happy'
    
    // 简单推荐逻辑：匹配 emotion_tag
    db.all("SELECT * FROM dapps WHERE emotion_tag = ? OR emotion_tag = 'neutral' LIMIT 3", [emotion], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});
// Prompt引擎
const PromptEngine = {
  // 情感响应Prompt
  emotionResponse(emotion, scene, userAge) {
    const ageGroup = userAge < 12 ? '儿童' : userAge < 18 ? '青少年' : '成人';
    
    const prompts = {
      car: {
        happy: `作为一个${ageGroup}的AI旅行伙伴,用户现在心情很好,在车上。请用温暖、欢快的语气回应,可以分享一些有趣的话题或建议播放欢快的音乐。`,
        sad: `作为一个${ageGroup}的AI情感伙伴,用户现在情绪低落,在车上。请用温柔、支持的语气回应,提供情感支持,可以播放治愈的音乐或分享鼓励的故事。`,
        anxious: `作为一个${ageGroup}的AI安全伙伴,用户现在感到焦虑,在驾驶中。请用平静、舒缓的语气回应,建议播放放松的音乐,并提醒注意安全。`,
        angry: `作为一个${ageGroup}的AI冷静伙伴,用户现在情绪激动,在车上。请用平和、理性的语气回应,帮助用户冷静下来,建议休息或播放舒缓音乐。`
      },
      ktv: {
        happy: `作为KTV的AI助手,用户们现在很开心。推荐一些热门、欢快的歌曲,鼓励大家一起合唱,营造欢乐气氛。`,
        excited: `作为KTV的AI DJ,气氛很嗨!推荐节奏感强的歌曲,可以开启特效模式,让派对更精彩。`,
        sad: `作为KTV的AI知心朋友,有人情绪低落。推荐一些抒情、治愈的歌曲,给予情感支持,让音乐帮助表达情感。`,
        calm: `作为KTV的AI音乐顾问,气氛比较平静。推荐一些经典、舒缓的歌曲,适合小组慢慢欣赏。`
      },
      story: {
        happy: `作为AI故事讲述者,参与者心情愉快。创造一个轻松、冒险的故事情节,充满惊喜和乐趣。`,
        anxious: `作为AI故事引导者,参与者有些紧张。创造一个悬疑但不过分恐怖的情节,适度的紧张感能增加参与度。`,
        excited: `作为AI剧情大师,参与者很兴奋。创造一个高潮迭起、充满转折的故事,满足他们的冒险欲望。`
      }
    };

    return prompts[scene]?.[emotion] || `作为AI伙伴,根据用户的${emotion}情绪,提供合适的互动。`;
  },

  // 故事生成Prompt
  storyGeneration(sceneType, participants, currentPlot) {
    const participantDesc = participants.map(p => 
      `${p.name}(${p.age}岁, ${p.role || '参与者'})`
    ).join(', ');

    return `
你是一个互动故事创作大师。

参与者: ${participantDesc}
场景: ${sceneType}
当前剧情: ${currentPlot || '故事开始'}

请创作下一个故事片段,要求:
1. 情节要有趣、引人入胜
2. 给每个参与者分配角色和任务
3. 提供3-4个选择让参与者决定故事走向
4. 语言要适合参与者的年龄
5. 包含适度的悬念和转折

以JSON格式返回:
{
  "scene": "场景描述(100-200字)",
  "characters": {
    "角色名": "角色当前状态和行动"
  },
  "options": [
    {"id": 1, "text": "选项1", "consequence": "可能结果"},
    {"id": 2, "text": "选项2", "consequence": "可能结果"}
  ],
  "emotion": "建议的场景氛围"
}
    `;
  },

  // 音乐混音Prompt
  musicMixing(emotions, participants, style) {
    return `
作为AI音乐制作人,为多人场景创造个性化音乐。

参与者情绪: ${emotions.join(', ')}
参与者信息: ${JSON.stringify(participants)}
风格偏好: ${style}

请设计音乐混音方案,以JSON格式返回:
{
  "bpm": "建议的BPM(60-180)",
  "key": "建议的调性",
  "instruments": ["使用的乐器列表"],
  "structure": {
    "intro": "前奏设计",
    "verse": "主歌设计",
    "chorus": "副歌设计",
    "outro": "尾奏设计"
  },
  "effects": ["音效列表"],
  "personalTracks": {
    "参与者名": "个性化音轨描述"
  }
}
    `;
  }
};

// WebSocket连接管理
const sessions = new Map(); // sessionId -> session data

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 初始化会话
  socket.on('init_session', async (data) => {
    const { sessionId, scene, participants } = data;
    
    sessions.set(sessionId, {
      scene,
      participants,
      emotions: {},
      currentStory: null,
      musicMix: null,
      startTime: Date.now()
    });

    socket.join(sessionId);
    socket.emit('session_ready', { sessionId, status: 'initialized' });
  });

  // 实时情感分析
  socket.on('emotion_update', async (data) => {
    const { sessionId, userId, audioData, text } = data;
    const session = sessions.get(sessionId);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    try {
      // 调用FastAPI进行情感分析
      const emotionResult = await axios.post(
        `${config.fastApiUrl}/api/v1/emotion/analyze`,
        {
          audio_data: audioData,
          text,
          scene: session.scene,
          user_age: session.participants.find(p => p.id === userId)?.age || 25,
          group_size: session.participants.length
        }
      );

      const emotion = emotionResult.data.data;
      
      // 更新会话情感状态
      session.emotions[userId] = emotion;

      // 生成AI响应
      const prompt = PromptEngine.emotionResponse(
        emotion.emotion,
        session.scene,
        session.participants.find(p => p.id === userId)?.age || 25
      );

      const aiResponse = await OpenAIService.chat([
        { role: 'system', content: prompt },
        { role: 'user', content: text || '...' }
      ]);

      // 生成语音
      const audioResponse = await OpenAIService.generateAudio(
        aiResponse,
        { voice: 'alloy', speed: 1.0 }
      );

      // 广播给房间内所有人
      io.to(sessionId).emit('emotion_result', {
        userId,
        emotion,
        aiResponse,
        audioResponse
      });

    } catch (error) {
      console.error('Emotion update error:', error);
      socket.emit('error', { message: 'Emotion analysis failed' });
    }
  });

  // 故事互动
  socket.on('story_action', async (data) => {
    const { sessionId, action, userId } = data;
    const session = sessions.get(sessionId);

    if (!session) return;

    try {
      const prompt = PromptEngine.storyGeneration(
        session.scene,
        session.participants,
        session.currentStory
      );

      const storyUpdate = await OpenAIService.chat([
        { role: 'system', content: prompt },
        { role: 'user', content: `参与者选择了: ${action}` }
      ], { temperature: 0.8 });

      const storyData = JSON.parse(storyUpdate);
      session.currentStory = storyData;

      // 生成故事语音
      const audioNarration = await OpenAIService.generateAudio(
        storyData.scene,
        { voice: 'onyx', speed: 0.95 }
      );

      io.to(sessionId).emit('story_update', {
        story: storyData,
        audio: audioNarration
      });

    } catch (error) {
      console.error('Story action error:', error);
    }
  });

  // 音乐混音请求
  socket.on('music_mix', async (data) => {
    const { sessionId } = data;
    const session = sessions.get(sessionId);

    if (!session) return;

    try {
      const emotions = Object.values(session.emotions).map(e => e.emotion);
      
      const prompt = PromptEngine.musicMixing(
        emotions,
        session.participants,
        data.style || 'adaptive'
      );

      const mixPlan = await OpenAIService.chat([
        { role: 'system', content: prompt }
      ], { temperature: 0.7 });

      const mixData = JSON.parse(mixPlan);

      // 调用FastAPI生成实际音乐
      const musicResult = await axios.post(
        `${config.fastApiUrl}/api/v1/music/mix`,
        {
          emotions,
          participants: session.participants,
          style: data.style || 'adaptive'
        }
      );

      session.musicMix = musicResult.data.data;

      io.to(sessionId).emit('music_ready', {
        mix: session.musicMix,
        plan: mixData
      });

    } catch (error) {
      console.error('Music mix error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// REST API端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Emotion Companion - Node.js Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 获取会话信息
app.get('/api/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

// 创建新会话
app.post('/api/sessions', (req, res) => {
  const { scene, participants } = req.body;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  sessions.set(sessionId, {
    scene,
    participants,
    emotions: {},
    currentStory: null,
    musicMix: null,
    startTime: Date.now()
  });

  res.json({ sessionId, status: 'created' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
server.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📡 WebSocket ready for connections`);
  console.log(`🤖 FastAPI backend: ${config.fastApiUrl}`);
});

module.exports = { app, io };