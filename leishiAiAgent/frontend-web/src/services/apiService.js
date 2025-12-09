/**
 * API服务层 - 与后端通信
 * 文件: frontend-web/src/services/apiService.js
 * 功能: 封装所有API调用
 */

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
const TIMEOUT = 30000; // 30秒超时

/**
 * 辅助函数 - Blob转Base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 发送请求的通用方法
 */
const request = async (method, endpoint, data = null, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || TIMEOUT);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers
      },
      body: data ? JSON.stringify(data) : null,
      signal: controller.signal,
      ...options
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw err;
  }
};

/**
 * 认证接口
 */
export const authAPI = {
  login: (username) =>
    request('POST', '/auth/login', { username }),

  logout: () =>
    request('POST', '/auth/logout'),

  getCurrentUser: () =>
    request('GET', '/auth/me')
};

/**
 * 情绪识别接口
 */
export const emotionAPI = {
  analyze: async (input) => {
    // 如果是音频blob，需要转换为base64
    if (input.type === 'audio') {
      const base64 = await blobToBase64(input.data);
      return request('POST', '/emotion/analyze', {
        audio: base64,
        userId: input.userId
      });
    }

    // 文本输入
    return request('POST', '/emotion/analyze', {
      text: input.data,
      userId: input.userId
    });
  },

  getEmotionHistory: (userId, days = 7) =>
    request('GET', `/emotion/history?userId=${userId}&days=${days}`),

  getEmotionTrend: (userId) =>
    request('GET', `/emotion/trend?userId=${userId}`)
};

/**
 * 应用推荐接口
 */
export const appAPI = {
  getRecommendations: (params) =>
    request('POST', '/apps/recommend', params),

  searchApps: (query) =>
    request('GET', `/apps/search?q=${encodeURIComponent(query)}`),

  getAllApps: () =>
    request('GET', '/apps'),

  getAppDetails: (appId) =>
    request('GET', `/apps/${appId}`),

  recordAppUsage: (appId, userId, sessionId) =>
    request('POST', '/apps/usage', { appId, userId, sessionId })
};

/**
 * 记忆接口
 */
export const memoryAPI = {
  createMemory: (memoryData) =>
    request('POST', '/memory/create', memoryData),

  getMemories: (userId, limit = 50, offset = 0) =>
    request('GET', `/memory/list?userId=${userId}&limit=${limit}&offset=${offset}`),

  getMemoryDetail: (memoryId) =>
    request('GET', `/memory/${memoryId}`),

  updateMemory: (memoryId, data) =>
    request('PUT', `/memory/${memoryId}`, data),

  deleteMemory: (memoryId) =>
    request('DELETE', `/memory/${memoryId}`),

  getMemorySummary: (userId, period = 'month') =>
    request('GET', `/memory/summary?userId=${userId}&period=${period}`),

  shareMemory: (memoryId, options) =>
    request('POST', `/memory/${memoryId}/share`, options)
};

/**
 * 高级API - 用户交互层的简化接口
 */

/**
 * 分析情绪
 */
export const analyzeEmotion = async (input) => {
  try {
    // 使用emotionAPI.analyze统一处理
    const result = await emotionAPI.analyze({
      data: input.data,
      type: input.type,
      userId: input.userId
    });

    // 映射情绪类型到标准格式
    const emotionTypeMap = {
      'sad': 'sad',
      'sadness': 'sad',
      '悲伤': 'sad',
      'calm': 'calm',
      'calmness': 'calm',
      '平静': 'calm',
      'happy': 'happy',
      'happiness': 'happy',
      '快乐': 'happy',
      'joy': 'happy',
      'neutral': 'neutral',
      '中性': 'neutral'
    };

    const emotionType = emotionTypeMap[result.emotion_type?.toLowerCase()] || 
                       emotionTypeMap[result.emotion?.toLowerCase()] || 
                       'neutral';

    const emotionNames = {
      'sad': '悲伤',
      'calm': '平静',
      'happy': '快乐',
      'neutral': '中性'
    };

    return {
      type: emotionType,
      intensity: result.intensity || result.confidence || 0.5,
      confidence: result.confidence || result.intensity || 0.5,
      transcript: result.transcript || (input.type === 'text' ? input.data : ''),
      name: emotionNames[emotionType] || '中性'
    };
  } catch (err) {
    console.error('情绪分析失败:', err);
    throw err;
  }
};

/**
 * 获取应用推荐
 */
export const getAppRecommendations = async (params) => {
  try {
    const result = await appAPI.getRecommendations({
      emotion_type: params.emotionType,
      emotion_intensity: params.emotionIntensity,
      user_id: params.userId
    });

    // 返回格式化的应用列表
    return (result.recommended_apps || []).map((app, idx) => ({
      id: app.id,
      name: app.name,
      type: app.type,
      category: app.category,
      description: app.description,
      features: app.features || [],
      rank: idx + 1,
      matchScore: app.match_score,
      icon: app.icon,
      link: app.entry_point
    }));
  } catch (err) {
    console.error('获取推荐失败:', err);
    throw err;
  }
};

/**
 * 搜索应用
 */
export const searchApps = async (query) => {
  try {
    const result = await appAPI.searchApps(query);
    return (result.apps || []).map(app => ({
      id: app.id,
      name: app.name,
      type: app.type,
      category: app.category,
      description: app.description,
      features: app.features || [],
      icon: app.icon
    }));
  } catch (err) {
    console.error('应用搜索失败:', err);
    throw err;
  }
};

/**
 * 获取所有应用
 */
export const getAllApps = async () => {
  try {
    const result = await appAPI.getAllApps();
    return (result.apps || []).map(app => ({
      id: app.id,
      name: app.name,
      type: app.type,
      category: app.category,
      description: app.description,
      features: app.features || [],
      icon: app.icon
    }));
  } catch (err) {
    console.error('获取应用列表失败:', err);
    throw err;
  }
};

/**
 * 保存会话记忆
 */
export const saveMemory = async (sessionData) => {
  try {
    return await memoryAPI.createMemory({
      user_id: sessionData.userId,
      emotion_type: sessionData.emotionType,
      emotion_intensity: sessionData.emotionIntensity,
      app_used: sessionData.appUsed,
      duration: sessionData.duration,
      content: sessionData.content,
      notes: sessionData.notes,
      is_shared: sessionData.isShared || false
    });
  } catch (err) {
    console.error('保存记忆失败:', err);
    throw err;
  }
};

/**
 * 获取用户记忆列表
 */
export const getUserMemories = async (userId, limit = 50, offset = 0) => {
  try {
    const result = await memoryAPI.getMemories(userId, limit, offset);
    return {
      total: result.total,
      memories: (result.memories || []).map(mem => ({
        id: mem.id,
        emotionType: mem.emotion_type,
        emotionIntensity: mem.emotion_intensity,
        appUsed: mem.app_used,
        createdAt: new Date(mem.created_at),
        duration: mem.duration,
        summary: mem.summary,
        tags: mem.tags || []
      }))
    };
  } catch (err) {
    console.error('获取记忆失败:', err);
    throw err;
  }
};

export default {
  authAPI,
  emotionAPI,
  appAPI,
  memoryAPI,
  analyzeEmotion,
  getAppRecommendations,
  searchApps,
  getAllApps,
  saveMemory,
  getUserMemories
};
