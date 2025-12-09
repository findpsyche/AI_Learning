/**
 * 记忆管理API端点
 * 文件: backend-nodejs/src/controllers/memoryController.js
 * 功能: 创建、查询、更新、删除记忆
 */

const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * 创建记忆
 */
const createMemory = async (req, res) => {
  try {
    const {
      user_id,
      emotion_type,
      emotion_intensity,
      app_used,
      duration,
      content,
      notes,
      is_shared
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: '缺少user_id参数' });
    }

    const db = require('../database/sqlite');
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    // 调用Python服务生成摘要
    let summary = '';
    let tags = [];

    try {
      const result = await callPythonService('POST', '/api/v1/memory/summarize', {
        content: content || notes,
        emotion_type,
        app_used
      });
      summary = result.summary;
      tags = result.tags || [];
    } catch (err) {
      console.warn('生成摘要失败，使用默认值:', err.message);
      summary = (notes || content || '').substring(0, 200);
      tags = [emotion_type, app_used];
    }

    // 保存到数据库
    db.prepare(`
      INSERT INTO memories 
      (id, user_id, emotion_type, emotion_intensity, app_used, duration, 
       content, summary, tags, notes, is_shared, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      memoryId,
      user_id,
      emotion_type,
      emotion_intensity,
      app_used,
      duration,
      content,
      summary,
      JSON.stringify(tags),
      notes,
      is_shared ? 1 : 0,
      createdAt
    );

    res.json({
      id: memoryId,
      user_id,
      created_at: createdAt,
      summary,
      tags
    });
  } catch (error) {
    console.error('创建记忆失败:', error);
    res.status(500).json({ error: '创建失败' });
  }
};

/**
 * 获取记忆列表
 */
const getMemories = async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少userId参数' });
    }

    const db = require('../database/sqlite');

    // 获取总数
    const totalResult = db.prepare(`
      SELECT COUNT(*) as count FROM memories WHERE user_id = ?
    `).get(userId);

    // 获取分页数据
    const memories = db.prepare(`
      SELECT * FROM memories 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(limit), parseInt(offset));

    const formatted = (memories || []).map(mem => ({
      id: mem.id,
      emotion_type: mem.emotion_type,
      emotion_intensity: mem.emotion_intensity,
      app_used: mem.app_used,
      created_at: mem.created_at,
      duration: mem.duration,
      summary: mem.summary,
      tags: mem.tags ? JSON.parse(mem.tags) : [],
      is_shared: mem.is_shared === 1
    }));

    res.json({
      total: totalResult.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      memories: formatted
    });
  } catch (error) {
    console.error('获取记忆失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
};

/**
 * 获取记忆详情
 */
const getMemoryDetail = async (req, res) => {
  try {
    const { memoryId } = req.params;
    const db = require('../database/sqlite');

    const memory = db.prepare(`
      SELECT * FROM memories WHERE id = ?
    `).get(memoryId);

    if (!memory) {
      return res.status(404).json({ error: '记忆不存在' });
    }

    res.json(formatMemory(memory));
  } catch (error) {
    console.error('获取记忆详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
};

/**
 * 更新记忆
 */
const updateMemory = async (req, res) => {
  try {
    const { memoryId } = req.params;
    const { notes, tags, is_shared } = req.body;
    const db = require('../database/sqlite');

    db.prepare(`
      UPDATE memories 
      SET notes = ?, tags = ?, is_shared = ?
      WHERE id = ?
    `).run(
      notes || '',
      JSON.stringify(tags || []),
      is_shared ? 1 : 0,
      memoryId
    );

    const memory = db.prepare(`
      SELECT * FROM memories WHERE id = ?
    `).get(memoryId);

    res.json(formatMemory(memory));
  } catch (error) {
    console.error('更新记忆失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
};

/**
 * 删除记忆
 */
const deleteMemory = async (req, res) => {
  try {
    const { memoryId } = req.params;
    const db = require('../database/sqlite');

    db.prepare(`
      DELETE FROM memories WHERE id = ?
    `).run(memoryId);

    res.json({ success: true });
  } catch (error) {
    console.error('删除记忆失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
};

/**
 * 获取记忆摘要
 */
const getMemorySummary = async (req, res) => {
  try {
    const { userId, period = 'month' } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少userId参数' });
    }

    const db = require('../database/sqlite');
    const cutoffDate = getDateCutoff(period);

    // 统计各情绪的记忆数量
    const emotionStats = db.prepare(`
      SELECT emotion_type, COUNT(*) as count, AVG(emotion_intensity) as avg_intensity
      FROM memories
      WHERE user_id = ? AND created_at >= ?
      GROUP BY emotion_type
    `).all(userId, cutoffDate);

    // 获取最常用的应用
    const appStats = db.prepare(`
      SELECT app_used, COUNT(*) as count
      FROM memories
      WHERE user_id = ? AND created_at >= ?
      GROUP BY app_used
      ORDER BY count DESC
      LIMIT 5
    `).all(userId, cutoffDate);

    // 总会话数
    const totalSessions = db.prepare(`
      SELECT COUNT(*) as count FROM memories
      WHERE user_id = ? AND created_at >= ?
    `).get(userId, cutoffDate);

    res.json({
      period,
      period_start: cutoffDate,
      period_end: new Date().toISOString(),
      total_sessions: totalSessions.count,
      emotion_distribution: emotionStats || [],
      top_apps: appStats || []
    });
  } catch (error) {
    console.error('获取摘要失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
};

/**
 * 分享记忆
 */
const shareMemory = async (req, res) => {
  try {
    const { memoryId } = req.params;
    const { platform } = req.body;

    const db = require('../database/sqlite');

    const memory = db.prepare(`
      SELECT * FROM memories WHERE id = ?
    `).get(memoryId);

    if (!memory) {
      return res.status(404).json({ error: '记忆不存在' });
    }

    // 更新分享状态
    db.prepare(`
      UPDATE memories SET is_shared = 1 WHERE id = ?
    `).run(memoryId);

    // 生成分享链接
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `${process.env.APP_URL || 'http://localhost'}/share/${shareToken}`;

    res.json({
      shared: true,
      share_url: shareUrl,
      share_token: shareToken,
      message: '已复制分享链接，可分享到社交媒体'
    });
  } catch (error) {
    console.error('分享失败:', error);
    res.status(500).json({ error: '分享失败' });
  }
};

/**
 * 辅助函数
 */

const callPythonService = async (method, endpoint, data) => {
  return await axios({
    method,
    url: `${FASTAPI_URL}${endpoint}`,
    data,
    timeout: 30000
  }).then(res => res.data);
};

const formatMemory = (memory) => {
  if (!memory) return null;

  return {
    id: memory.id,
    user_id: memory.user_id,
    emotion_type: memory.emotion_type,
    emotion_intensity: memory.emotion_intensity,
    app_used: memory.app_used,
    duration: memory.duration,
    content: memory.content,
    summary: memory.summary,
    tags: memory.tags ? JSON.parse(memory.tags) : [],
    notes: memory.notes,
    is_shared: memory.is_shared === 1,
    created_at: memory.created_at
  };
};

const getDateCutoff = (period) => {
  const now = new Date();
  let cutoff = new Date();

  switch (period) {
    case 'week':
      cutoff.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoff.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      cutoff.setFullYear(now.getFullYear() - 1);
      break;
    default:
      cutoff.setMonth(now.getMonth() - 1);
  }

  return cutoff.toISOString();
};

module.exports = {
  createMemory,
  getMemories,
  getMemoryDetail,
  updateMemory,
  deleteMemory,
  getMemorySummary,
  shareMemory
};
