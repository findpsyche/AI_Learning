/**
 * 认证API端点
 * 文件: backend-nodejs/src/controllers/authController.js
 * 功能: 用户登录、注册、会话管理
 */

const crypto = require('crypto');

/**
 * 用户登录
 */
const login = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.length < 2 || username.length > 20) {
      return res.status(400).json({
        error: '用户名长度必须在2-20个字符之间'
      });
    }

    const db = require('../database/sqlite');

    // 检查用户是否存在
    let user = db.prepare(`
      SELECT * FROM users WHERE username = ?
    `).get(username);

    // 如果不存在则创建
    if (!user) {
      const userId = generateUserId();
      const createdAt = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (id, username, created_at)
        VALUES (?, ?, ?)
      `).run(userId, username, createdAt);

      user = {
        id: userId,
        username: username,
        created_at: createdAt
      };
    }

    // 生成令牌
    const token = generateToken(user.id);

    // 创建会话
    const sessionId = generateSessionId();
    db.prepare(`
      INSERT INTO sessions (id, user_id, token, created_at, last_activity)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, user.id, token, new Date().toISOString(), new Date().toISOString());

    res.json({
      success: true,
      userId: user.id,
      username: user.username,
      token: token,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

/**
 * 用户注册
 */
const register = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.length < 2 || username.length > 20) {
      return res.status(400).json({
        error: '用户名长度必须在2-20个字符之间'
      });
    }

    const db = require('../database/sqlite');

    // 检查用户是否已存在
    const existingUser = db.prepare(`
      SELECT * FROM users WHERE username = ?
    `).get(username);

    if (existingUser) {
      return res.status(409).json({
        error: '用户名已存在'
      });
    }

    // 创建新用户
    const userId = generateUserId();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, username, created_at)
      VALUES (?, ?, ?)
    `).run(userId, username, createdAt);

    const token = generateToken(userId);

    res.json({
      success: true,
      userId: userId,
      username: username,
      token: token
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
};

/**
 * 登出
 */
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const db = require('../database/sqlite');
      db.prepare(`
        UPDATE sessions SET ended_at = ? WHERE token = ?
      `).run(new Date().toISOString(), token);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({ error: '登出失败' });
  }
};

/**
 * 获取当前用户信息
 */
const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }

    const db = require('../database/sqlite');

    const session = db.prepare(`
      SELECT * FROM sessions WHERE token = ?
    `).get(token);

    if (!session) {
      return res.status(401).json({ error: '会话不存在' });
    }

    const user = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).get(session.user_id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
};

/**
 * 辅助函数 - 生成用户ID
 */
const generateUserId = () => {
  return `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * 辅助函数 - 生成会话ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

/**
 * 辅助函数 - 生成令牌
 */
const generateToken = (userId) => {
  const payload = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

module.exports = {
  login,
  register,
  logout,
  getCurrentUser
};
