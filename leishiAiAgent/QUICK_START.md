# 🎵 声景 Soundscape - 快速参考指南

## 🚀 30秒快速启动

### Docker启动 (推荐)
```bash
cd deployment/docker
docker-compose up -d
# ✅ 完成！访问 http://localhost
```

### 本地开发启动
```bash
# 终端1: 前端
cd frontend-web
npm install && npm run dev

# 终端2: Node.js后端
cd backend-nodejs
npm install && npm run dev

# 终端3: Python后端
cd backend-ai
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

---

## 📍 服务地址

| 服务 | 地址 | 端口 | 用途 |
|------|------|------|------|
| 前端 | http://localhost:5173 | 5173 | Web应用 |
| Node.js | http://localhost:3000 | 3000 | WebSocket |
| Python | http://localhost:8000 | 8000 | FastAPI |
| Nginx | http://localhost | 80 | 反向代理 (Docker) |

---

## 🎯 5个核心应用

| 应用 | 模式 | 核心功能 |
|------|------|---------|
| 🧘 **疗愈站** | 聊天/音乐/冥想/日记 | AI治愈对话 |
| 🎬 **剧场** | 播客/电台/有声书/漫谈 | 内容消费 |
| 🎵 **工坊** | 哼唱/编曲/混音/分享 | 音乐创作 |
| 🤖 **助手** | 聊天/新闻/日程/灵感 | 日常助理 |
| 📚 **记忆** | 时间线/情绪/统计 | 数据分析 |

---

## 🔧 配置关键文件

### 环境变量 (`.env`)
```
OPENAI_API_KEY=sk-xxxxxxxxx          # 必需！
NODE_ENV=production
DATABASE_URL=sqlite:///soundscape.db
```

### 路由配置 (`frontend-web/src/routes.jsx`)
```javascript
/welcome       → 欢迎页
/home          → 主页
/emotion       → 情绪识别
/healing       → 疗愈站
/theatre       → 剧场
/workshop      → 工坊
/assistant     → 助手
/memory        → 记忆库
```

---

## 📡 API端点速查

### WebSocket (Socket.io)
```
socket.emit('chat:message', {roomId, message, emotion})
socket.on('chat:message', (data) => {})
socket.emit('notification:send', {...})
```

### OpenAI API (FastAPI)
```
POST /api/v1/openai/transcribe        语音→文字
POST /api/v1/openai/generate-text     文本生成
POST /api/v1/openai/synthesize-speech 文字→语音
POST /api/v1/openai/voice-chat        完整语音聊天
POST /api/v1/openai/healing-content   治愈内容
POST /api/v1/openai/music-recommendation 音乐推荐
```

---

## 🧪 测试命令

### 前端测试
```bash
npm test                    # 运行所有测试
npm test -- --watch       # 监视模式
npm test -- --coverage    # 覆盖率报告
```

### 后端测试
```bash
pytest tests/ -v           # 运行所有测试
pytest tests/test_services.py::TestEmotionAnalyzer -v
pytest --cov=app          # 覆盖率报告
```

---

## 🐛 常见问题

### Q: OpenAI API Key 报错？
```
A: 1. 检查 .env 文件中有 OPENAI_API_KEY
   2. Docker: docker-compose restart
   3. 重新构建: docker-compose build --no-cache
```

### Q: WebSocket 连接失败？
```
A: 1. 检查 Node.js 服务是否运行
   2. 检查防火墙端口 3000 是否开放
   3. 查看浏览器控制台错误
```

### Q: 数据库初始化失败？
```
A: 1. 删除旧数据库: rm database/soundscape.db
   2. 重新初始化: docker exec soundscape-python python init_db.py
   3. 检查数据库目录权限
```

### Q: 内存占用过高？
```
A: 1. 检查进程: docker stats
   2. 减少日志级别: LOG_LEVEL=warn
   3. 清理临时文件: docker-compose down -v
```

---

## 📊 架构图

```
┌────────────────────────────────────────────────────┐
│                   用户浏览器                        │
│          (React 18 + Socket.io Client)             │
└────────────┬────────────────────────────────────────┘
             │ HTTP / WebSocket
┌────────────▼────────────────────────────────────────┐
│              Nginx 反向代理 (Port 80/443)           │
│         (静态文件 + 请求转发 + SSL)                 │
└────┬──────────────────────┬──────────────────────────┘
     │ WebSocket            │ HTTP REST
┌────▼────────────────┐  ┌──▼──────────────────────┐
│   Node.js Express   │  │  Python FastAPI        │
│   Socket.io Server  │  │  OpenAI Integration    │
│   Port 3000         │  │  Port 8000             │
│                     │  │                        │
│ ✓ 聊天消息         │  │ ✓ Whisper (语音→文字)  │
│ ✓ 实时通知         │  │ ✓ GPT-4 (文本生成)    │
│ ✓ 房间管理         │  │ ✓ TTS (文字→语音)     │
│ ✓ 状态同步         │  │ ✓ 情绪分析             │
└────┬────────────────┘  └──┬──────────────────────┘
     │                       │
     └───────────┬───────────┘
                 │
          ┌──────▼──────┐
          │   SQLite    │
          │  Database   │
          │ (Memories,  │
          │  Sessions)  │
          └─────────────┘
```

---

## 📈 性能基准 (预期)

| 指标 | 预期值 | 备注 |
|------|--------|------|
| 首页加载 | < 2s | 缓存开启 |
| API响应 | < 500ms | 不含OpenAI调用 |
| WebSocket延迟 | < 100ms | 本地网络 |
| 内存占用 | < 500MB | 3个容器 |
| 并发连接 | 100+ | Socket.io |

---

## 🔐 安全检查清单

- [ ] OPENAI_API_KEY 已配置在环境变量
- [ ] SSL/HTTPS 已启用 (生产环境)
- [ ] CORS 已正确配置
- [ ] 防火墙已设置 (仅开放80/443)
- [ ] 定期备份数据库
- [ ] 定期更新依赖包
- [ ] 日志监控已启用
- [ ] 错误告警已配置

---

## 📚 重要文件位置

```
soundscape/
├── README.md                                    # 项目说明
├── FINAL_COMPLETION_REPORT.md                  # 完成报告 ⭐
├── DEPLOYMENT_GUIDE.md                         # 部署指南 ⭐
├── .env.example                                # 环境配置示例
│
├── frontend-web/
│   ├── src/pages/                              # 5个应用页面
│   ├── src/hooks/useWebSocket.js               # WebSocket Hook
│   ├── src/__tests__/                          # 测试文件
│   └── package.json                            # 前端依赖
│
├── backend-nodejs/
│   ├── src/services/websocketService.js        # WebSocket服务
│   ├── src/app.js                              # Express应用
│   └── package.json                            # Node依赖
│
├── backend-ai/
│   ├── app/services/openai_service.py          # OpenAI集成 ⭐
│   ├── app/api/endpoints/openai_routes.py      # API路由 ⭐
│   ├── tests/test_services.py                  # 后端测试
│   ├── requirements.txt                        # Python依赖
│   └── init_db.py                              # 数据库初始化
│
├── deployment/
│   ├── docker/
│   │   ├── docker-compose.yml                  # 容器编排 ⭐
│   │   ├── Dockerfile.nodejs                   # Node.js镜像
│   │   ├── Dockerfile.python                   # Python镜像
│   │   └── nginx/nginx.conf                    # Nginx配置
│   │
│   ├── config/
│   │   ├── monitor.json                        # 监控配置
│   │   └── production.env                      # 生产环境
│   │
│   └── scripts/
│       ├── deploy.sh                           # 部署脚本
│       ├── backup.sh                           # 备份脚本
│       └── monitor.sh                          # 监控脚本
│
└── docs/
    ├── API.md                                  # API文档
    ├── DEPLOYMENT.md                           # 部署文档
    ├── DEVELOPMENT.md                          # 开发指南
    └── USER_GUIDE.md                           # 用户指南
```

---

## 🎓 学习资源

- **React**: https://react.dev
- **Socket.io**: https://socket.io/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Docker**: https://docs.docker.com
- **OpenAI API**: https://platform.openai.com/docs

---

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 📞 获取帮助

- 📖 查看 `DEPLOYMENT_GUIDE.md`
- 🐛 查看故障排除部分
- 💬 GitHub Discussions
- 📧 联系开发者

---

**最后更新**: 2025年12月8日  
**项目状态**: ✅ 生产就绪  
**版本**: 1.0.0

🎉 **准备好启动了吗？** 
