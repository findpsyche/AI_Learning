// WebSocket Service - Socket.io 管理和事件处理
// 用于实时聊天、通知、协作编辑等功能

const socketIO = require('socket.io');
const logger = require('../middleware/logger');

class WebSocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.users = new Map(); // userId -> { socket, roomsId, status }
    this.rooms = new Map(); // roomId -> { members: Set, type, createdAt }
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // 验证连接用户
    this.io.use((socket, next) => {
      const userId = socket.handshake.query.userId;
      const token = socket.handshake.headers.authorization;

      if (!userId) {
        return next(new Error('Missing userId'));
      }

      // 验证token (可选)
      if (token) {
        // 在这里验证token逻辑
      }

      socket.userId = userId;
      socket.username = socket.handshake.query.username || `User_${userId}`;
      next();
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      logger.info(`User ${userId} connected: ${socket.id}`);

      // 存储用户信息
      this.users.set(userId, {
        socket,
        roomIds: new Set(),
        status: 'online',
        connectedAt: new Date()
      });

      // 广播用户上线
      this.io.emit('user:online', {
        userId,
        username: socket.username,
        timestamp: new Date()
      });

      // 聊天事件
      socket.on('chat:message', (data) => this.handleChatMessage(socket, data));
      socket.on('chat:typing', (data) => this.handleTyping(socket, data));

      // 房间事件
      socket.on('room:join', (data) => this.handleRoomJoin(socket, data));
      socket.on('room:leave', (data) => this.handleRoomLeave(socket, data));

      // 通知事件
      socket.on('notification:send', (data) => this.handleNotification(socket, data));

      // 协作编辑事件
      socket.on('collab:update', (data) => this.handleCollabUpdate(socket, data));

      // 状态事件
      socket.on('status:update', (data) => this.handleStatusUpdate(socket, data));

      // 音乐协作事件
      socket.on('music:play', (data) => this.handleMusicPlay(socket, data));
      socket.on('music:pause', (data) => this.handleMusicPause(socket, data));
      socket.on('music:seek', (data) => this.handleMusicSeek(socket, data));

      // 断开连接
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  // ==================== 聊天事件 ====================
  handleChatMessage(socket, data) {
    const { roomId, message, emotion } = data;
    const userId = socket.userId;

    const messageData = {
      id: `msg_${Date.now()}`,
      userId,
      username: socket.username,
      message,
      emotion,
      timestamp: new Date(),
      roomId
    };

    logger.info(`Chat message in room ${roomId}: ${message.substring(0, 50)}`);

    if (roomId) {
      // 房间消息
      this.io.to(roomId).emit('chat:message', messageData);
    } else {
      // 广播消息
      this.io.emit('chat:message', messageData);
    }
  }

  handleTyping(socket, data) {
    const { roomId, isTyping } = data;
    const userId = socket.userId;

    const typingData = {
      userId,
      username: socket.username,
      isTyping,
      timestamp: new Date()
    };

    if (roomId) {
      socket.to(roomId).emit('chat:typing', typingData);
    } else {
      socket.broadcast.emit('chat:typing', typingData);
    }
  }

  // ==================== 房间事件 ====================
  handleRoomJoin(socket, data) {
    const { roomId, roomType } = data;
    const userId = socket.userId;

    // 加入房间
    socket.join(roomId);

    // 更新用户房间信息
    const user = this.users.get(userId);
    if (user) {
      user.roomIds.add(roomId);
    }

    // 创建或更新房间
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        members: new Set([userId]),
        type: roomType || 'chat',
        createdAt: new Date()
      });
    } else {
      this.rooms.get(roomId).members.add(userId);
    }

    const room = this.rooms.get(roomId);
    const roomData = {
      roomId,
      userId,
      username: socket.username,
      members: Array.from(room.members),
      memberCount: room.members.size,
      timestamp: new Date()
    };

    logger.info(`User ${userId} joined room ${roomId}`);

    // 通知房间内其他用户
    this.io.to(roomId).emit('room:member:joined', roomData);

    // 发送房间成员列表给加入者
    socket.emit('room:members', {
      roomId,
      members: Array.from(room.members),
      memberCount: room.members.size
    });
  }

  handleRoomLeave(socket, data) {
    const { roomId } = data;
    const userId = socket.userId;

    socket.leave(roomId);

    const user = this.users.get(userId);
    if (user) {
      user.roomIds.delete(roomId);
    }

    const room = this.rooms.get(roomId);
    if (room) {
      room.members.delete(userId);

      if (room.members.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    const leaveData = {
      roomId,
      userId,
      username: socket.username,
      memberCount: room ? room.members.size : 0,
      timestamp: new Date()
    };

    logger.info(`User ${userId} left room ${roomId}`);

    this.io.to(roomId).emit('room:member:left', leaveData);
  }

  // ==================== 通知事件 ====================
  handleNotification(socket, data) {
    const { targetUserId, type, title, content, action } = data;
    const userId = socket.userId;

    const notification = {
      id: `notif_${Date.now()}`,
      fromUserId: userId,
      fromUsername: socket.username,
      type, // 'info', 'warning', 'success', 'error'
      title,
      content,
      action,
      timestamp: new Date(),
      read: false
    };

    if (targetUserId) {
      // 发送给特定用户
      const targetUser = this.users.get(targetUserId);
      if (targetUser) {
        targetUser.socket.emit('notification:received', notification);
      }
    } else {
      // 广播通知
      this.io.emit('notification:received', notification);
    }

    logger.info(`Notification sent: ${title}`);
  }

  // ==================== 协作编辑事件 ====================
  handleCollabUpdate(socket, data) {
    const { roomId, documentId, changes, version } = data;
    const userId = socket.userId;

    const update = {
      userId,
      username: socket.username,
      documentId,
      changes,
      version,
      timestamp: new Date()
    };

    logger.info(`Collab update in room ${roomId}, doc ${documentId}`);

    socket.to(roomId).emit('collab:update', update);
  }

  // ==================== 状态事件 ====================
  handleStatusUpdate(socket, data) {
    const { status } = data; // 'online', 'away', 'busy', 'offline'
    const userId = socket.userId;

    const user = this.users.get(userId);
    if (user) {
      user.status = status;
    }

    const statusData = {
      userId,
      username: socket.username,
      status,
      timestamp: new Date()
    };

    logger.info(`User ${userId} status changed to ${status}`);

    this.io.emit('user:status:changed', statusData);
  }

  // ==================== 音乐协作事件 ====================
  handleMusicPlay(socket, data) {
    const { roomId, musicId, title, timestamp } = data;
    const userId = socket.userId;

    const playData = {
      userId,
      username: socket.username,
      musicId,
      title,
      playedAt: new Date(),
      timestamp
    };

    logger.info(`Music playing in room ${roomId}: ${title}`);

    socket.to(roomId).emit('music:play', playData);
  }

  handleMusicPause(socket, data) {
    const { roomId, musicId } = data;
    const userId = socket.userId;

    const pauseData = {
      userId,
      username: socket.username,
      musicId,
      pausedAt: new Date()
    };

    socket.to(roomId).emit('music:pause', pauseData);
  }

  handleMusicSeek(socket, data) {
    const { roomId, musicId, currentTime } = data;
    const userId = socket.userId;

    const seekData = {
      userId,
      username: socket.username,
      musicId,
      currentTime,
      seekedAt: new Date()
    };

    socket.to(roomId).emit('music:seek', seekData);
  }

  // ==================== 断开连接 ====================
  handleDisconnect(socket) {
    const userId = socket.userId;

    // 移除用户
    const user = this.users.get(userId);
    if (user) {
      // 离开所有房间
      user.roomIds.forEach(roomId => {
        const room = this.rooms.get(roomId);
        if (room) {
          room.members.delete(userId);
          if (room.members.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      });

      this.users.delete(userId);
    }

    logger.info(`User ${userId} disconnected: ${socket.id}`);

    // 广播用户离线
    this.io.emit('user:offline', {
      userId,
      username: socket.username,
      timestamp: new Date()
    });
  }

  // ==================== 工具方法 ====================
  /**
   * 获取所有在线用户
   */
  getOnlineUsers() {
    return Array.from(this.users.entries()).map(([userId, user]) => ({
      userId,
      username: user.socket.username,
      status: user.status,
      roomIds: Array.from(user.roomIds),
      connectedAt: user.connectedAt
    }));
  }

  /**
   * 获取房间成员
   */
  getRoomMembers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.members).map(userId => {
      const user = this.users.get(userId);
      return {
        userId,
        username: user ? user.socket.username : 'Unknown',
        status: user ? user.status : 'offline'
      };
    });
  }

  /**
   * 广播给特定房间
   */
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * 广播给所有用户
   */
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  /**
   * 发送给特定用户
   */
  sendToUser(userId, event, data) {
    const user = this.users.get(userId);
    if (user) {
      user.socket.emit(event, data);
    }
  }
}

module.exports = WebSocketService;
