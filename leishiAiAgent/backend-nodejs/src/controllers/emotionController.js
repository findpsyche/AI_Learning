/**
 * 情绪分析API端点
 * 文件: backend-nodejs/src/api/emotionController.js
 * 功能: 处理情绪识别请求、调用Python AI服务
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * 分析情绪 - 支持语音和文本输入
 */
const analyzeEmotion = async (req, res) => {
  try {
    const { audio, text, userId } = req.body;

    if (!audio && !text) {
      return res.status(400).json({
        error: '需要提供音频或文本输入'
      });
    }

    // 调用Python FastAPI服务
    let analysisResult;

    if (audio) {
      // 语音输入：转录 + 情绪分析
      analysisResult = await callPythonService('POST', '/api/v1/emotion/analyze', {
        audio_data: audio,
        input_type: 'audio'
      });
    } else {
      // 文本输入：直接情绪分析
      analysisResult = await callPythonService('POST', '/api/v1/emotion/analyze', {
        text: text,
        input_type: 'text'
      });
    }

    // 保存到数据库
    if (userId) {
      saveEmotionRecord(userId, analysisResult);
    }

    res.json({
      emotion_type: analysisResult.emotion_type,
      intensity: analysisResult.intensity || analysisResult.confidence,
      confidence: analysisResult.confidence,
      transcript: analysisResult.transcript || text
    });
  } catch (error) {
    console.error('情绪分析失败:', error);
    res.status(500).json({
      error: error.message || '情绪分析失败'
    });
  }
};

/**
 * 获取情绪历史
 */
const getEmotionHistory = async (req, res) => {
  try {
    const { userId, days = 7 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少userId参数' });
    }

    // 从数据库查询
    const history = await queryEmotionHistory(userId, parseInt(days));

    res.json({
      user_id: userId,
      days: parseInt(days),
      records: history
    });
  } catch (error) {
    console.error('查询情绪历史失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
};

/**
 * 获取情绪趋势
 */
const getEmotionTrend = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少userId参数' });
    }

    // 计算情绪趋势
    const trend = await calculateEmotionTrend(userId);

    res.json({
      user_id: userId,
      trend: trend,
      overall_emotion: trend.primary_emotion,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取情绪趋势失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
};

/**
 * 辅助函数 - 调用Python服务
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
    throw new Error(`Python AI服务不可用: ${error.message}`);
  }
};

/**
 * 辅助函数 - 保存情绪记录
 */
const saveEmotionRecord = (userId, emotionData) => {
  try {
    const db = require('../database/sqlite');
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO emotion_records 
      (user_id, emotion_type, intensity, confidence, transcript, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      emotionData.emotion_type,
      emotionData.intensity || emotionData.confidence,
      emotionData.confidence,
      emotionData.transcript || '',
      now
    );
  } catch (error) {
    console.error('保存情绪记录失败:', error);
  }
};

/**
 * 辅助函数 - 查询情绪历史
 */
const queryEmotionHistory = async (userId, days) => {
  try {
    const db = require('../database/sqlite');
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const records = db.prepare(`
      SELECT * FROM emotion_records 
      WHERE user_id = ? AND created_at >= ?
      ORDER BY created_at DESC
    `).all(userId, cutoffDate.toISOString());

    return records || [];
  } catch (error) {
    console.error('查询历史失败:', error);
    return [];
  }
};

/**
 * 辅助函数 - 计算情绪趋势
 */
const calculateEmotionTrend = async (userId) => {
  try {
    const db = require('../database/sqlite');
    const history = db.prepare(`
      SELECT emotion_type, COUNT(*) as count, AVG(intensity) as avg_intensity
      FROM emotion_records
      WHERE user_id = ?
      GROUP BY emotion_type
      ORDER BY count DESC
    `).all(userId);

    const emotionCounts = {};
    history.forEach(record => {
      emotionCounts[record.emotion_type] = {
        count: record.count,
        intensity: record.avg_intensity
      };
    });

    const primaryEmotion = history.length > 0 ? history[0].emotion_type : 'neutral';

    return {
      primary_emotion: primaryEmotion,
      emotion_distribution: emotionCounts,
      total_sessions: history.reduce((sum, r) => sum + r.count, 0)
    };
  } catch (error) {
    console.error('计算趋势失败:', error);
    return {
      primary_emotion: 'neutral',
      emotion_distribution: {},
      total_sessions: 0
    };
  }
};

module.exports = {
  analyzeEmotion,
  getEmotionHistory,
  getEmotionTrend
};
