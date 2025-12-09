// useWebSocket - React Hook for Socket.io 实时通信
// 用于在React组件中管理WebSocket连接和事件

import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';

export const useWebSocket = (options = {}) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [typing, setTyping] = useState(new Map());
  const [notifications, setNotifications] = useState([]);

  // 初始化连接
  useEffect(() => {
    const userId = options.userId || localStorage.getItem('userId');
    const username = options.username || localStorage.getItem('username');

    if (!userId) {
      console.warn('useWebSocket: userId not provided');
      return;
    }

    const socketURL = options.socketURL || process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

    socketRef.current = io(socketURL, {
      query: {
        userId,
        username
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // 连接事件
    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      options.onConnect?.();
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      options.onDisconnect?.();
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      options.onError?.(error);
    });

    // 用户在线事件
    socketRef.current.on('user:online', (data) => {
      console.log('User online:', data);
      options.onUserOnline?.(data);
    });

    socketRef.current.on('user:offline', (data) => {
      console.log('User offline:', data);
      options.onUserOffline?.(data);
    });

    socketRef.current.on('user:status:changed', (data) => {
      console.log('User status changed:', data);
      options.onStatusChanged?.(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [options]);

  // 发送聊天消息
  const sendMessage = useCallback((roomId, message, emotion) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:message', {
        roomId,
        message,
        emotion,
        timestamp: new Date()
      });
    }
  }, []);

  // 发送正在输入状态
  const sendTyping = useCallback((roomId, isTyping) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:typing', {
        roomId,
        isTyping
      });
    }
  }, []);

  // 监听聊天消息
  const onMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('chat:message', callback);
      return () => socketRef.current?.off('chat:message', callback);
    }
  }, []);

  // 监听正在输入状态
  const onTyping = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('chat:typing', (data) => {
        setTyping(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, data);
          } else {
            newMap.delete(data.userId);
          }
          return newMap;
        });
        callback(data);
      });
      return () => socketRef.current?.off('chat:typing', callback);
    }
  }, []);

  // 加入房间
  const joinRoom = useCallback((roomId, roomType = 'chat') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('room:join', {
        roomId,
        roomType
      });

      // 监听房间成员列表
      socketRef.current.on('room:members', (data) => {
        setRoomMembers(data.members || []);
      });

      // 监听成员加入
      socketRef.current.on('room:member:joined', (data) => {
        setRoomMembers(data.members || []);
      });

      // 监听成员离开
      socketRef.current.on('room:member:left', (data) => {
        setRoomMembers(prev => 
          prev.filter(m => m.userId !== data.userId)
        );
      });
    }
  }, []);

  // 离开房间
  const leaveRoom = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('room:leave', {
        roomId
      });
      setRoomMembers([]);
    }
  }, []);

  // 发送通知
  const sendNotification = useCallback((targetUserId, type, title, content, action) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('notification:send', {
        targetUserId,
        type,
        title,
        content,
        action
      });
    }
  }, []);

  // 监听通知
  const onNotification = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('notification:received', (data) => {
        setNotifications(prev => [data, ...prev]);
        callback(data);
      });
      return () => socketRef.current?.off('notification:received', callback);
    }
  }, []);

  // 发送协作更新
  const sendCollabUpdate = useCallback((roomId, documentId, changes, version) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('collab:update', {
        roomId,
        documentId,
        changes,
        version
      });
    }
  }, []);

  // 监听协作更新
  const onCollabUpdate = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('collab:update', callback);
      return () => socketRef.current?.off('collab:update', callback);
    }
  }, []);

  // 更新用户状态
  const updateStatus = useCallback((status) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('status:update', {
        status
      });
    }
  }, []);

  // 音乐协作: 播放
  const playMusicInRoom = useCallback((roomId, musicId, title, timestamp = 0) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('music:play', {
        roomId,
        musicId,
        title,
        timestamp
      });
    }
  }, []);

  // 音乐协作: 暂停
  const pauseMusicInRoom = useCallback((roomId, musicId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('music:pause', {
        roomId,
        musicId
      });
    }
  }, []);

  // 音乐协作: 拖动
  const seekMusicInRoom = useCallback((roomId, musicId, currentTime) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('music:seek', {
        roomId,
        musicId,
        currentTime
      });
    }
  }, []);

  // 监听音乐播放
  const onMusicPlay = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('music:play', callback);
      return () => socketRef.current?.off('music:play', callback);
    }
  }, []);

  // 监听音乐暂停
  const onMusicPause = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('music:pause', callback);
      return () => socketRef.current?.off('music:pause', callback);
    }
  }, []);

  // 监听音乐拖动
  const onMusicSeek = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('music:seek', callback);
      return () => socketRef.current?.off('music:seek', callback);
    }
  }, []);

  // 自定义事件监听
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current?.off(event, callback);
    }
  }, []);

  // 自定义事件发送
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    // 状态
    connected,
    onlineUsers,
    roomMembers,
    typing,
    notifications,

    // 聊天方法
    sendMessage,
    sendTyping,
    onMessage,
    onTyping,

    // 房间方法
    joinRoom,
    leaveRoom,

    // 通知方法
    sendNotification,
    onNotification,

    // 协作方法
    sendCollabUpdate,
    onCollabUpdate,

    // 状态方法
    updateStatus,

    // 音乐协作方法
    playMusicInRoom,
    pauseMusicInRoom,
    seekMusicInRoom,
    onMusicPlay,
    onMusicPause,
    onMusicSeek,

    // 通用方法
    on,
    emit,

    // Socket 实例 (用于高级用法)
    socket: socketRef.current
  };
};

export default useWebSocket;
