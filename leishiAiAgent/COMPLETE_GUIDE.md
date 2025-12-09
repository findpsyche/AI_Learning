# SoundScape - 声境 项目完整指南

## 项目概述

**声景 (SoundScape)** 是一个AI驱动的情感识别与声音治疗应用平台，通过智能情绪分析为用户推荐个性化的内容和应用，帮助用户在悲伤、平静、快乐等不同情绪状态下找到最合适的声音疗愈体验。

### 核心特性

- 🎯 **多模态情绪识别**: 支持文本和语音输入的情绪分析
- 🎵 **智能应用推荐**: 根据检测的情绪推荐最适合的DApp
- 📱 **4个专业DApp**:
  - 🌙 **声音疗愈站** (HealingStation): 悲伤时的陪伴与治愈
  - 🎙️ **声音剧场** (SoundTheatre): 平静时的高质量内容
  - 🎼 **AI音乐工坊** (MusicWorkshop): 快乐时的创意表达
  - 🤖 **个人声音助手** (VoiceAssistant): 日常信息与灵感
- 💾 **记忆系统**: 保存、分析、可视化情感历史
- 📊 **情绪分析**: 查看趋势、分布、统计数据

### 技术栈

#### 后端
- **框架**: FastAPI + Express.js
- **数据库**: SQLite（轻量级，适合1GB服务器）
- **AI服务**: OpenAI API (Whisper, GPT-4, TTS)
- **ORM**: SQLAlchemy 2.0
- **实时通信**: Socket.io WebSocket

#### 前端
- **框架**: React 18 + Vite
- **路由**: React Router v6
- **状态管理**: localStorage + Context API
- **Web Audio API**: 语音录制和处理

#### 部署
- **容器化**: Docker + docker-compose
- **Web服务器**: Nginx
- **目标环境**: Tencent CVM (1GB内存, 2核CPU)

---

## 项目结构

```
soundscape/
├── backend-ai/                    # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py               # FastAPI 主应用
│   │   ├── models/
│   │   │   └── emotion.py        # SQLAlchemy ORM 模型
│   │   ├── services/
│   │   │   ├── emotion_analyzer.py        # 情绪分析服务
│   │   │   ├── dapp_recommender.py        # DApp推荐引擎
│   │   │   └── ...
│   │   └── api/endpoints/
│   │       ├── emotion.py        # 情绪识别API
│   │       ├── recommend.py      # 应用推荐API
│   │       ├── memory.py         # 记忆管理API
│   │       └── ...
│   ├── tests/
│   │   ├── test_services.py      # 单元测试
│   │   └── test_integration.py   # 集成测试
│   ├── requirements.txt           # Python 依赖
│   └── init_db.py                # 数据库初始化脚本
│
├── backend-nodejs/                # Node.js Express 后端
│   ├── src/
│   │   ├── app.js                # Express 应用
│   │   ├── controllers/          # 业务控制器
│   │   ├── services/             # 服务层
│   │   └── routes/               # API 路由
│   └── package.json
│
├── frontend-web/                  # React 前端
│   ├── src/
│   │   ├── App.jsx               # 应用入口
│   │   ├── main.jsx              # React DOM 挂载
│   │   ├── routes.jsx            # 路由配置
│   │   ├── pages/
│   │   │   ├── HomePage.jsx                      # 主页
│   │   │   ├── EmotionDetectionPage.jsx          # 情绪检测
│   │   │   ├── HealingStationPage.jsx            # 治愈站
│   │   │   ├── SoundTheatrePage.jsx              # 声音剧场
│   │   │   ├── MusicWorkshopPage.jsx             # 音乐工坊
│   │   │   ├── VoiceAssistantPage.jsx            # 语音助手
│   │   │   └── MemoryLibraryPage.jsx             # 记忆库
│   │   ├── components/           # React 组件
│   │   ├── services/             # API 服务
│   │   └── styles/               # CSS 样式
│   ├── package.json
│   └── vite.config.js
│
├── deployment/                    # 部署配置
│   ├── docker/
│   │   ├── docker-compose.yml    # 容器编排
│   │   ├── Dockerfile.python     # Python 镜像
│   │   ├── Dockerfile.nodejs     # Node.js 镜像
│   │   └── Dockerfile.web        # 前端镜像
│   ├── nginx/
│   │   └── nginx.conf            # Nginx 配置
│   └── scripts/
│       ├── deploy.sh
│       ├── backup.sh
│       └── monitor.sh
│
└── docs/                          # 文档
    ├── API.md                     # API 文档
    ├── DEPLOYMENT.md              # 部署指南
    └── USER_GUIDE.md              # 用户指南
```

---

## 快速开始

### 前置要求

- Python 3.9+
- Node.js 16+ 
- npm 或 yarn
- Docker & Docker Compose（可选，用于容器化部署）

### 1. 环境配置

#### 1.1 Python 后端

```bash
# 进入项目目录
cd soundscape/backend-ai

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖（已优化为1GB服务器）
pip install -r requirements.txt

# 创建环境变量文件
cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///soundscape.db
DEBUG=True
EOF
```

#### 1.2 初始化数据库

```bash
# 初始化SQLite数据库和种子数据
python init_db.py

# 结果: soundscape.db 已创建，包含所有表和默认DApp推荐规则
```

#### 1.3 启动Python服务

```bash
# 方式1: 直接运行（开发）
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 方式2: 使用gunicorn（生产）
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

访问: http://localhost:8000/docs （Swagger API文档）

### 2. 运行测试

#### 2.1 单元测试

```bash
# 运行所有测试
pytest tests/ -v

# 运行特定测试
pytest tests/test_services.py -v
pytest tests/test_integration.py -v

# 生成覆盖率报告
pytest tests/ --cov=app --cov-report=html
# 查看: htmlcov/index.html
```

#### 2.2 集成测试

```bash
# 运行集成测试套件
pytest tests/test_integration.py -v --tb=short

# 运行特定测试类
pytest tests/test_integration.py::TestEmotionAPI -v
pytest tests/test_integration.py::TestRecommendationAPI -v
pytest tests/test_integration.py::TestMemoryAPI -v
```

### 3. 前端配置

```bash
# 进入前端目录
cd soundscape/frontend-web

# 安装依赖
npm install
# 或
yarn install

# 启动开发服务器
npm run dev
# 或
yarn dev

# 访问: http://localhost:5173
```

### 4. 完整本地运行

#### 使用 Docker Compose（推荐）

```bash
cd soundscape/deployment/docker

# 启动所有服务（Python后端 + Node后端 + React前端）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问:
- 前端: http://localhost:80
- Python API: http://localhost:8000
- Python Docs: http://localhost:8000/docs
- Node API: http://localhost:3000

#### 不使用 Docker 的本地运行

打开3个终端分别运行:

```bash
# 终端1: Python FastAPI
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000

# 终端2: Node.js Express（如需要）
cd backend-nodejs
npm install
npm start

# 终端3: React 前端
cd frontend-web
npm install
npm run dev
```

---

## 核心API端点

### 情绪分析 (`/api/v1/emotion/`)

#### 分析情绪
```
POST /api/v1/emotion/analyze
Content-Type: application/json

{
  "text": "我今天感到很悲伤",
  "audio_base64": null,
  "user_id": 1,
  "scene": "general"
}

响应 (200):
{
  "emotion": "sad",
  "intensity": 0.85,
  "valence": 0.2,
  "arousal": 0.3,
  "confidence": 0.92,
  "color": "#95A3B3",
  "emoji": "😢",
  "label_cn": "悲伤",
  "reasoning": "检测到用户表达了负面情绪...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 获取情绪历史
```
GET /api/v1/emotion/history/{user_id}?limit=50
```

#### 获取情绪统计
```
GET /api/v1/emotion/statistics/{user_id}?days=7
```

### 应用推荐 (`/api/v1/recommend/`)

#### 推荐应用
```
POST /api/v1/recommend/apps
Content-Type: application/json

{
  "emotion_type": "sad",
  "emotion_intensity": 0.85,
  "device_type": "mobile",
  "time_of_day": "evening"
}

响应 (200):
{
  "emotion_type": "sad",
  "emotion_intensity": 0.85,
  "recommended_apps": [
    {
      "id": 1,
      "name": "声音疗愈站",
      "type": "healing",
      "description": "AI陪伴对话、治愈音乐、冥想引导...",
      "icon": "🌙",
      "features": ["AI对话", "音乐", "冥想"],
      "entry_point": "/healing",
      "match_score": 0.95
    }
  ],
  "primary_recommendation": { ... }
}
```

#### 获取热门应用
```
GET /api/v1/recommend/top?limit=4
```

### 记忆管理 (`/api/v1/memory/`)

#### 创建记忆
```
POST /api/v1/memory/create
{
  "user_id": 1,
  "memory_type": "text",
  "emotion_type": "sad",
  "emotion_intensity": 0.7,
  "content": "今天过得不太好",
  "tags": ["工作", "压力"]
}
```

#### 获取记忆列表
```
GET /api/v1/memory/user/{user_id}/list?limit=50&offset=0
```

#### 获取时间线
```
GET /api/v1/memory/user/{user_id}/timeline?days=30
```

#### 获取情绪趋势
```
GET /api/v1/memory/user/{user_id}/emotions/trend?period=week
```

#### 搜索记忆
```
POST /api/v1/memory/user/{user_id}/search?query=开心&emotion_type=happy
```

---

## 数据模型

### 情绪分析结果

```python
{
  "emotion": str,           # sad, calm, happy, neutral, angry, anxious, excited
  "intensity": float,       # 0.0-1.0
  "valence": float,         # 情绪正负向 0.0-1.0
  "arousal": float,         # 激活度 0.0-1.0
  "confidence": float,      # 置信度 0.0-1.0
  "color": str,             # HEX颜色 #RRGGBB
  "emoji": str,             # 表情符号
  "label_cn": str,          # 中文标签
  "reasoning": str,         # 分析原因
  "recommendations": List[str]  # 建议列表
}
```

### DApp推荐规则

| 情绪类型 | 强度范围 | 推荐应用 | 理由 |
|---------|---------|--------|------|
| sad | 0.5-1.0 | 声音疗愈站 | 需要陪伴与治愈 |
| calm | 0.3-0.8 | 声音剧场 | 适合享受高质量内容 |
| happy | 0.6-1.0 | AI音乐工坊 | 最好的创意表达时刻 |
| neutral | 0.0-0.5 | 个人声音助手 | 日常信息与灵感 |

### 数据库表

#### Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  preferences JSON
);
```

#### Sessions
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  current_emotion TEXT,
  emotion_intensity FLOAT,
  current_dapp TEXT,
  started_at DATETIME,
  ended_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

#### Memory
```sql
CREATE TABLE memory (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_id INTEGER,
  memory_type TEXT,         -- text, audio, image, video
  emotion_type TEXT,
  emotion_intensity FLOAT,
  content TEXT,
  summary TEXT,
  tags JSON,
  audio_path TEXT,
  image_path TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);
```

---

## 性能优化（1GB服务器）

### 1. 轻量级依赖
- ❌ 不使用: TensorFlow, PyTorch, transformers（太重）
- ✅ 使用: OpenAI API（云端计算）

### 2. 数据库优化
```python
# SQLAlchemy 连接池配置
engine = create_engine(
    DATABASE_URL,
    pool_size=5,           # 连接池大小
    max_overflow=10,
    pool_pre_ping=True,    # 检查连接有效性
    echo=False             # 关闭SQL日志
)
```

### 3. 缓存策略
```python
# ContentCache 表存储频繁查询的结果
cache_ttl = 24 * 3600  # 24小时
```

### 4. 异步处理
- 所有I/O操作使用 async/await
- WebSocket 用于实时通信
- 后台任务用于批处理

### 5. 前端优化
- Lazy loading for DApp pages
- localStorage for offline support
- 减少初始包大小

---

## 常见任务

### 创建新用户

```bash
curl -X POST http://localhost:8000/api/v1/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com"
  }'
```

### 测试情绪识别

```bash
curl -X POST http://localhost:8000/api/v1/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "我很开心！",
    "scene": "general"
  }'
```

### 运行测试

```bash
# 全部测试
pytest tests/ -v

# 特定测试
pytest tests/test_integration.py::TestEmotionAPI -v

# 覆盖率报告
pytest tests/ --cov=app --cov-report=html
```

---

## 故障排查

### 1. 数据库连接错误
```
解决: 检查 soundscape.db 是否存在
python init_db.py
```

### 2. OpenAI API 错误
```
解决: 检查环境变量
echo $OPENAI_API_KEY
# 或设置
export OPENAI_API_KEY=your_key
```

### 3. 前端跨域错误
```
解决: 检查后端CORS配置（main.py 中已配置）
allow_origins=["*"]
```

### 4. 内存不足
```
解决: 降低 SQLAlchemy pool_size，增加 cache_ttl
或使用 Redis 缓存（企业版）
```

---

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 许可证

MIT License - 详见 LICENSE 文件

---

## 联系方式

- 项目主页: [GitHub Link]
- 问题反馈: [Issues Link]
- 讨论区: [Discussions Link]

---

## 更新日志

### v1.0.0 (2024-01-15)
- ✅ 情绪识别系统完成
- ✅ DApp推荐引擎完成
- ✅ 记忆管理系统完成
- ✅ 4个DApp完成
- ✅ 测试套件完成
- ✅ Docker部署完成

---

## 致谢

感谢所有贡献者和支持者！🙏

**让声音成为治愈的力量** 🎵
