/**
 * API路由配置
 * 文件: backend-nodejs/src/routes/api.js
 * 功能: 注册所有API端点
 */

const express = require('express');
const router = express.Router();

// 导入控制器
const authController = require('../controllers/authController');
const emotionController = require('../controllers/emotionController');
const appController = require('../controllers/appController');
const memoryController = require('../controllers/memoryController');

// ==================== 认证端点 ====================
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authController.getCurrentUser);

// ==================== 情绪识别端点 ====================
router.post('/emotion/analyze', emotionController.analyzeEmotion);
router.get('/emotion/history', emotionController.getEmotionHistory);
router.get('/emotion/trend', emotionController.getEmotionTrend);

// ==================== 应用推荐端点 ====================
router.post('/apps/recommend', appController.getRecommendations);
router.get('/apps/search', appController.searchApps);
router.get('/apps', appController.getAllApps);
router.get('/apps/:appId', appController.getAppDetails);
router.post('/apps/usage', appController.recordAppUsage);

// ==================== 记忆管理端点 ====================
router.post('/memory/create', memoryController.createMemory);
router.get('/memory/list', memoryController.getMemories);
router.get('/memory/:memoryId', memoryController.getMemoryDetail);
router.put('/memory/:memoryId', memoryController.updateMemory);
router.delete('/memory/:memoryId', memoryController.deleteMemory);
router.get('/memory/summary', memoryController.getMemorySummary);
router.post('/memory/:memoryId/share', memoryController.shareMemory);

// ==================== 健康检查 ====================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
