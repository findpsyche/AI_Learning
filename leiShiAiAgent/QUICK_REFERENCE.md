# 🎵 声景 SoundScape - 快速参考卡片

## 核心命令

### 环境初始化
```bash
# Python后端初始化
cd backend-ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 初始化数据库
python init_db.py

# 前端初始化
cd ../frontend-web
npm install
```

### 启动服务

```bash
# 方式1: 一键启动（推荐）
cd 项目根目录
python start_all.py
# 选择启动方式

# 方式2: Docker
cd deployment/docker
docker-compose up -d

# 方式3: 手动启动（3个终端）
# 终端1
cd backend-ai
python -m uvicorn app.main:app --reload --port 8000

# 终端2
cd frontend-web  
npm run dev

# 终端3（可选）
cd backend-nodejs
npm start
```

### 测试和验证

```bash
cd backend-ai

# 验证项目设置
python verify_setup.py

# 运行所有测试
pytest tests/ -v

# 运行特定测试
pytest tests/test_integration.py::TestEmotionAPI -v

# 生成覆盖率报告
pytest tests/ --cov=app --cov-report=html
```

---

## API端点速查

### 情绪分析
```
POST   /api/v1/emotion/analyze           # 分析情绪
GET    /api/v1/emotion/history/{uid}     # 情绪历史
GET    /api/v1/emotion/statistics/{uid}  # 情绪统计
POST   /api/v1/emotion/batch-analyze     # 批量分析
```

### 应用推荐
```
POST   /api/v1/recommend/apps            # 获取推荐
POST   /api/v1/recommend/personalize     # 个性化推荐
GET    /api/v1/recommend/top             # 热门应用
POST   /api/v1/recommend/feedback        # 推荐反馈
```

### 记忆管理
```
POST   /api/v1/memory/create             # 创建记忆
GET    /api/v1/memory/{mid}              # 查询记忆
GET    /api/v1/memory/user/{uid}/list    # 列表查询
PUT    /api/v1/memory/{mid}              # 更新记忆
DELETE /api/v1/memory/{mid}              # 删除记忆
GET    /api/v1/memory/user/{uid}/timeline    # 时间线
GET    /api/v1/memory/user/{uid}/emotions/trend  # 趋势
GET    /api/v1/memory/user/{uid}/tags         # 标签
POST   /api/v1/memory/user/{uid}/search       # 搜索
```

---

## 文件结构概览

```
soundscape/
├── backend-ai/              # Python FastAPI
│   ├── app/
│   │   ├── main.py         # FastAPI应用
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── api/endpoints/  # API路由
│   ├── tests/              # 测试文件
│   ├── requirements.txt     # 依赖列表
│   └── init_db.py          # 初始化脚本
├── frontend-web/            # React前端
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # 可复用组件
│   │   ├── services/       # API调用
│   │   └── styles/         # CSS样式
│   └── package.json
├── backend-nodejs/          # Node.js后端（可选）
├── deployment/              # 部署配置
│   ├── docker/             # Docker文件
│   ├── nginx/              # Nginx配置
│   └── scripts/            # 部署脚本
└── docs/                    # 文档
```

---

## 关键技术点

### 后端技术
- **框架**: FastAPI (0.104.1)
- **ORM**: SQLAlchemy (2.0.23)
- **数据库**: SQLite
- **API**: OpenAI (Whisper, GPT-4)
- **异步**: asyncio, uvicorn
- **测试**: pytest, pytest-asyncio

### 前端技术
- **框架**: React (18)
- **构建**: Vite
- **路由**: React Router (v6)
- **音频**: Web Audio API
- **测试**: Jest, React Testing Library

### 部署技术
- **容器**: Docker & docker-compose
- **Web服务器**: Nginx
- **反向代理**: Nginx
- **目标环境**: Tencent CVM (1GB, 2核)

---

## 核心业务流程

### 情绪识别 → 推荐 → 应用启动

```
1. 用户输入 (语音/文本)
   └─→ Whisper转录 | 直接使用

2. 情绪分析
   └─→ GPT-4分类 (emotion, intensity)

3. 应用推荐
   └─→ DAppRecommendation表查询
       └─→ 个性化过滤
           └─→ 返回排序推荐

4. 应用启动
   └─→ 用户选择应用
       └─→ 导航到对应页面
           └─→ 自动保存会话记录

5. 记忆存储
   └─→ 保存到Memory表
       └─→ 标签和分类
           └─→ 支持查询和分析
```

---

## 数据库表设计

### User (用户)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | STR | 用户名（唯一） |
| email | STR | 邮箱（唯一） |
| created_at | DT | 创建时间 |
| last_login | DT | 最后登录 |
| preferences | JSON | 用户偏好 |

### Memory (记忆)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户外键 |
| emotion_type | STR | sad/calm/happy/neutral |
| emotion_intensity | FLOAT | 0.0-1.0 |
| content | STR | 内容文本 |
| tags | JSON | 标签数组 |
| created_at | DT | 创建时间 |

### DAppRecommendation (推荐规则)
| 字段 | 类型 | 说明 |
|------|------|------|
| emotion | STR | 情绪类型 |
| dapp_name | STR | 应用名称 |
| min_intensity | FLOAT | 最小强度 |
| max_intensity | FLOAT | 最大强度 |
| priority | INT | 优先级 |

---

## 环境变量

```bash
# 必需
OPENAI_API_KEY=sk-...

# 可选
DATABASE_URL=sqlite:///soundscape.db
DEBUG=True
LOG_LEVEL=INFO
ENVIRONMENT=development|production
```

---

## 常见操作

### 创建新用户
```bash
curl -X POST http://localhost:8000/api/v1/users/create \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","email":"user1@example.com"}'
```

### 分析单个情绪
```bash
curl -X POST http://localhost:8000/api/v1/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"我很开心","scene":"general"}'
```

### 获取用户推荐
```bash
curl -X POST http://localhost:8000/api/v1/recommend/apps \
  -H "Content-Type: application/json" \
  -d '{"emotion_type":"happy","emotion_intensity":0.9}'
```

### 查询用户记忆
```bash
curl -X GET http://localhost:8000/api/v1/memory/user/1/list?limit=10
```

---

## 故障快速诊断

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| `ModuleNotFoundError` | 依赖未安装 | `pip install -r requirements.txt` |
| `sqlite3.DatabaseError` | 数据库损坏 | `python init_db.py` 重建 |
| `OPENAI_API_KEY not set` | 环境变量未设置 | `export OPENAI_API_KEY=...` |
| CORS 错误 | 跨域请求被阻止 | 检查 `main.py` CORS配置 |
| 内存溢出 | 缓存过大 | 减少 `pool_size` 或增加 `cache_ttl` |

---

## 性能基准

### 响应时间
- 情绪分析: 200-800ms (取决于OpenAI)
- 应用推荐: 50-100ms
- 记忆查询: <50ms
- 时间线聚合: 100-200ms (30天数据)

### 内存占用
- Python进程: 80-150MB
- Node.js进程: 60-100MB
- SQLite数据库: <50MB (初始)
- 前端加载: <5MB

---

## 开发工作流

```bash
# 1. 创建新特性分支
git checkout -b feature/MyFeature

# 2. 进行开发和测试
python -m uvicorn app.main:app --reload
npm run dev  # 前端

# 3. 运行测试
pytest tests/ -v
npm test     # 前端

# 4. 提交代码
git add .
git commit -m "Add MyFeature"
git push origin feature/MyFeature

# 5. 合并到main
git pull request  # 创建PR并审查
```

---

## 扩展建议

### 短期 (1-2周)
- [ ] 添加用户认证 (JWT)
- [ ] 实现用户订阅模型
- [ ] 添加社交分享功能

### 中期 (1-3个月)
- [ ] 多语言支持 (i18n)
- [ ] 高级分析仪表盘
- [ ] 推荐模型优化

### 长期 (3-6个月)
- [ ] 移动应用 (React Native)
- [ ] 社交网络功能
- [ ] 企业版功能

---

## 许可证 & 联系

- **许可证**: MIT
- **GitHub**: [Link]
- **问题反馈**: [Issues]
- **讨论区**: [Discussions]

---

**最后更新**: 2024年  
**维护者**: SoundScape 团队  
**状态**: ✅ 生产就绪

**让声音成为治愈的力量** 🎵
