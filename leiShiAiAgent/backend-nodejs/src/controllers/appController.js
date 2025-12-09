/**
 * 应用推荐API端点
 * 文件: backend-nodejs/src/controllers/appController.js
 * 功能: 根据情绪推荐应用、搜索应用
 */

const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * 获取应用推荐
 */
const getRecommendations = async (req, res) => {
  try {
    const { emotion_type, emotion_intensity, user_id } = req.body;

    if (!emotion_type) {
      return res.status(400).json({ error: '缺少emotion_type参数' });
    }

    // 调用Python推荐服务
    const recommendations = await callPythonService('POST', '/api/v1/recommend/apps', {
      emotion_type,
      emotion_intensity: emotion_intensity || 0.5,
      user_id
    });

    // 获取应用详情
    const appsWithDetails = await enrichAppDetails(recommendations.recommended_apps || []);

    res.json({
      emotion_type,
      recommended_apps: appsWithDetails
    });
  } catch (error) {
    console.error('获取推荐失败:', error);
    res.status(500).json({
      error: error.message || '获取推荐失败'
    });
  }
};

/**
 * 搜索应用
 */
const searchApps = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: '搜索词过短' });
    }

    // 从数据库搜索
    const apps = searchAppDatabase(q);

    res.json({
      query: q,
      apps: apps
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
};

/**
 * 获取所有应用
 */
const getAllApps = async (req, res) => {
  try {
    const db = require('../database/sqlite');

    const apps = db.prepare(`
      SELECT * FROM dapps
      WHERE status = 'active'
      ORDER BY popularity DESC
    `).all();

    res.json({
      total: apps.length,
      apps: apps.map(app => formatAppResponse(app))
    });
  } catch (error) {
    console.error('获取应用列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
};

/**
 * 获取应用详情
 */
const getAppDetails = async (req, res) => {
  try {
    const { appId } = req.params;
    const db = require('../database/sqlite');

    const app = db.prepare(`
      SELECT * FROM dapps WHERE id = ?
    `).get(appId);

    if (!app) {
      return res.status(404).json({ error: '应用不存在' });
    }

    res.json(formatAppResponse(app));
  } catch (error) {
    console.error('获取应用详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
};

/**
 * 记录应用使用
 */
const recordAppUsage = async (req, res) => {
  try {
    const { appId, userId, sessionId } = req.body;
    const db = require('../database/sqlite');

    const stmt = db.prepare(`
      INSERT INTO app_usage 
      (app_id, user_id, session_id, used_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(appId, userId, sessionId, new Date().toISOString());

    // 更新应用热度
    db.prepare(`
      UPDATE dapps SET usage_count = usage_count + 1
      WHERE id = ?
    `).run(appId);

    res.json({ success: true });
  } catch (error) {
    console.error('记录使用失败:', error);
    res.status(500).json({ error: '记录失败' });
  }
};

/**
 * 辅助函数 - 调用Python推荐服务
 */
const callPythonService = async (method, endpoint, data) => {
  try {
    const response = await axios({
      method,
      url: `${FASTAPI_URL}${endpoint}`,
      data,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Python服务调用失败:', error.message);
    // 返回默认推荐
    return getDefaultRecommendations(data.emotion_type);
  }
};

/**
 * 辅助函数 - 增强应用信息
 */
const enrichAppDetails = async (apps) => {
  try {
    const db = require('../database/sqlite');

    return apps.map(app => {
      const dbApp = db.prepare(`
        SELECT * FROM dapps WHERE id = ?
      `).get(app.id);

      return {
        ...app,
        ...formatAppResponse(dbApp || {})
      };
    });
  } catch (error) {
    console.error('增强应用信息失败:', error);
    return apps;
  }
};

/**
 * 辅助函数 - 搜索应用数据库
 */
const searchAppDatabase = (query) => {
  try {
    const db = require('../database/sqlite');
    const searchTerm = `%${query}%`;

    const apps = db.prepare(`
      SELECT * FROM dapps
      WHERE status = 'active' AND (
        name LIKE ? OR description LIKE ? OR category LIKE ?
      )
      ORDER BY popularity DESC
    `).all(searchTerm, searchTerm, searchTerm);

    return (apps || []).map(app => formatAppResponse(app));
  } catch (error) {
    console.error('搜索数据库失败:', error);
    return [];
  }
};

/**
 * 辅助函数 - 格式化应用响应
 */
const formatAppResponse = (app) => {
  if (!app || !app.id) return null;

  return {
    id: app.id,
    name: app.name,
    type: app.type, // 'healing', 'theatre', 'workshop', 'assistant'
    category: app.category,
    description: app.description,
    icon: app.icon,
    features: app.features ? JSON.parse(app.features) : [],
    entry_point: app.entry_point,
    popularity: app.usage_count || 0,
    match_score: app.match_score || 0
  };
};

/**
 * 辅助函数 - 默认推荐
 */
const getDefaultRecommendations = (emotionType) => {
  const defaults = {
    sad: {
      recommended_apps: [
        { id: 1, name: '声音疗愈站', type: 'healing', match_score: 0.95 }
      ]
    },
    calm: {
      recommended_apps: [
        { id: 2, name: '声音剧场', type: 'theatre', match_score: 0.9 }
      ]
    },
    happy: {
      recommended_apps: [
        { id: 3, name: 'AI音乐工坊', type: 'workshop', match_score: 0.92 }
      ]
    },
    neutral: {
      recommended_apps: [
        { id: 4, name: '个人声音助手', type: 'assistant', match_score: 0.85 }
      ]
    }
  };

  return defaults[emotionType] || defaults.neutral;
};

module.exports = {
  getRecommendations,
  searchApps,
  getAllApps,
  getAppDetails,
  recordAppUsage
};
