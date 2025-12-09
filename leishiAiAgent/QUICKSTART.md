# SoundScape 声境 - 完整部署和启动指南

## 📋 项目概述

**声境 SoundScape** 是一个AI驱动的声音娱乐应用，通过情绪识别为用户提供个性化的声音体验和内容推荐。

### 核心特性

- 🎤 **情绪识别**：语音/文本输入，AI分析情绪类型和强度
- 🎯 **智能推荐**：根据情绪推荐4类应用（疗愈/剧场/音乐/助手）
- 🎵 **多场景体验**：悲伤→疗愈站、平静→剧场、快乐→工坊、中性→助手
- 💾 **记忆系统**：自动保存会话、生成总结、支持分享
- 📊 **数据分析**：情绪趋势、应用使用统计、个性化学习

---

## 🏗️ 项目架构

```
┌─────────────────────────────────────────────┐
│         前端 (React + Vite)                  │
│  WelcomePage → HomePage → EmotionDetection  │
│         → AppRecommendation → Selected App  │
└──────────────┬──────────────────────────────┘
               │ /api
┌──────────────▼──────────────────────────────┐
│      Node.js API 网关 (3000)                 │
│  /auth, /emotion, /apps, /memory            │
└──────────────┬──────────────────────────────┘
               │ internal
┌──────────────▼────────────┐    ┌───────────┐
│  Python FastAPI (8000)    │    │ SQLite DB │
│  /emotion/analyze         │◄──►│ (本地)    │
│  /recommend/apps          │    └───────────┘
│  /memory/summarize        │
└───────────────────────────┘
```

---

## 🚀 快速启动（开发环境）

### 前置要求

- **Node.js** 16+
- **Python** 3.8+
- **npm** 或 **yarn**

### 1️⃣ 安装依赖

#### 前端
```bash
cd frontend-web
npm install
```

#### Node.js 后端
```bash
cd backend-nodejs
npm install
```

#### Python 后端
```bash
cd backend-ai
pip install -r requirements.txt
```

### 2️⃣ 配置环境变量

#### 根目录创建 `.env`
```bash
# OpenAI API
OPENAI_API_KEY=your_api_key_here

# 服务端口
FRONTEND_PORT=5173
NODEJS_PORT=3000
FASTAPI_PORT=8000

# 数据库
DB_PATH=./soundscape.db

# API地址
FASTAPI_URL=http://localhost:8000
NODE_API_URL=http://localhost:3000
```

#### `backend-ai/.env.example` → `backend-ai/.env`
```bash
OPENAI_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///soundscape.db
LOG_LEVEL=INFO
```

### 3️⃣ 初始化数据库

```bash
cd backend-ai
python init_db.py
```

**输出示例：**
```
✅ 数据库初始化成功: soundscape.db
✅ 已创建以下表: users, sessions, emotion_records, dapps, ...
✅ 已插入 4 个应用
```

### 4️⃣ 启动所有服务

#### 终端 1 - 前端开发服务器
```bash
cd frontend-web
npm run dev
# 访问: http://localhost:5173
```

#### 终端 2 - Node.js 后端
```bash
cd backend-nodejs
npm start
# 或: node src/app.js
# 服务: http://localhost:3000
```

#### 终端 3 - Python FastAPI 后端
```bash
cd backend-ai
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# 服务: http://localhost:8000
# 文档: http://localhost:8000/docs
```

---

## 📱 功能流程

### 用户入口流程

```
1. 欢迎页 (WelcomePage)
   ↓
   输入昵称 → 授权麦克风
   ↓
2. 主页 (HomePage)
   ↓
   显示: "__用户名，今天也很棒勒！"
   ↓
3. 情绪识别 (EmotionDetectionPage)
   ↓
   语音输入 / 文本输入
   ↓
4. 情绪分析 (Python)
   ↓
   返回: 情绪类型 + 强度
   ↓
5. 应用推荐 (AppRecommendation)
   ↓
   根据情绪推荐4个应用
   ↓
6. 应用选择
   ↓
   进入对应应用 (HealingStation / Theatre / Workshop / Assistant)
```

### 关键组件说明

| 组件 | 功能 | 路由 |
|------|------|------|
| **WelcomePage** | 用户欢迎和登录 | `/welcome` |
| **HomePage** | 主页，显示招呼语 | `/home` |
| **EmotionDetectionPage** | 情绪识别入口 | `/emotion-detection` |
| **AudioRecorder** | 音频录制组件 | - |
| **EmotionDisplay** | 情绪可视化球体 | - |
| **AppRecommendation** | 应用推荐和搜索 | - |
| **DAppCard** | 单个应用卡片 | - |

---

## 🔌 API 端点

### 认证相关
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
```

### 情绪识别
```
POST /api/emotion/analyze
  请求: { audio: base64 } 或 { text: "..." }
  响应: { emotion_type, intensity, confidence, transcript }

GET  /api/emotion/history?userId=xxx&days=7
GET  /api/emotion/trend?userId=xxx
```

### 应用推荐
```
POST /api/apps/recommend
  请求: { emotion_type, emotion_intensity, user_id }
  响应: { recommended_apps: [...] }

GET  /api/apps/search?q=搜索词
GET  /api/apps
GET  /api/apps/:appId
POST /api/apps/usage
```

### 记忆管理
```
POST /api/memory/create
GET  /api/memory/list?userId=xxx&limit=50
GET  /api/memory/:memoryId
PUT  /api/memory/:memoryId
DELETE /api/memory/:memoryId
GET  /api/memory/summary?userId=xxx&period=month
POST /api/memory/:memoryId/share
```

---

## 🗄️ 数据库表结构

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| **users** | 用户表 | id, username, created_at |
| **sessions** | 会话表 | id, user_id, token, created_at |
| **emotion_records** | 情绪记录 | id, user_id, emotion_type, intensity |
| **dapps** | 应用表 | id, name, type, category, entry_point |
| **app_usage** | 应用使用记录 | id, app_id, user_id, used_at |
| **memories** | 记忆表 | id, user_id, emotion_type, summary |
| **recommendation_feedback** | 推荐反馈 | id, user_id, recommended_app_id |

---

## 📊 情绪识别映射

| 情绪类型 | 推荐应用 | 特点 |
|---------|--------|------|
| **sad** (悲伤) | 声音疗愈站 | 强度>0.6时优先推荐 |
| **calm** (平静) | 声音剧场 | 适合放松和娱乐 |
| **happy** (快乐) | AI音乐工坊 | 最适合创意表达 |
| **neutral** (中性) | 个人声音助手 | 通用和效率导向 |

---

## 🎨 UI组件库

### 样式文件位置
```
frontend-web/src/styles/
├── Global.css           # 全局样式和响应式设计
├── WelcomePage.css      # 欢迎页
├── HomePage.css         # 主页
├── EmotionDetectionPage.css  # 情绪识别页
├── AudioRecorder.css    # 音频录制
├── EmotionDisplay.css   # 情绪展示
├── AppRecommendation.css # 应用推荐
└── DAppCard.css         # 应用卡片
```

### 响应式断点
- **手机**: ≤480px
- **平板**: 481px-768px
- **桌面**: 769px-1920px
- **KTV**: ≥1920px

---

## 🔧 常见问题排查

### 1. 数据库连接失败
```bash
# 确保数据库已初始化
cd backend-ai
python init_db.py
```

### 2. Python依赖缺失
```bash
cd backend-ai
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 端口被占用
```bash
# 查看占用情况
lsof -i :3000
lsof -i :8000
lsof -i :5173

# 修改端口
# frontend-web: vite.config.js
# backend-nodejs: .env NODEJS_PORT
# backend-ai: uvicorn 命令行参数
```

### 4. CORS 错误
确保 `backend-nodejs/app.js` 中 CORS 配置正确：
```javascript
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
```

### 5. OpenAI API 错误
检查：
- API Key 是否正确
- 账户余额是否充足
- 网络连接是否正常

---

## 📦 生产部署（Docker）

### 使用 Docker Compose
```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

### Docker Compose 配置
参见: `deployment/docker/docker-compose.yml`

---

## 📈 性能优化建议

### 前端
- ✅ 使用懒加载组件
- ✅ 音频流式传输
- ✅ 本地缓存情绪数据
- ✅ 图片和资源CDN加速

### 后端
- ✅ 缓存 API 响应
- ✅ 数据库索引优化
- ✅ 连接池管理
- ✅ 日志异步处理

### 数据库
- ✅ 定期备份
- ✅ 清理过期数据
- ✅ 查询优化

---

## 🔐 安全建议

- 🔒 环境变量管理（不要提交 `.env`）
- 🔒 输入验证和XSS防护
- 🔒 速率限制（防DDoS）
- 🔒 CSRF令牌保护
- 🔒 HTTPS部署（生产环境）

---

## 📚 文档和资源

- **API 文档**: `docs/API.md`
- **部署指南**: `docs/DEPLOYMENT.md`
- **开发指南**: `docs/DEVELOPMENT.md`
- **用户指南**: `docs/USER_GUIDE.md`

---

## 🤝 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18, Vite, React Router |
| **Node.js** | Express.js, SQLite3, Axios |
| **Python** | FastAPI, OpenAI API, Whisper |
| **部署** | Docker, Docker Compose, Nginx |
| **数据库** | SQLite (本地轻量级) |

---

## 📞 支持与贡献

有问题或建议？欢迎提交 Issue 或 PR！

---

**祝您使用愉快！声音是一种力量。🎵**
