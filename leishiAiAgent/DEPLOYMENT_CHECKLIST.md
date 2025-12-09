# 🎵 声景 SoundScape - 部署前检查清单

## 📋 部署准备清单

### 1. 环境准备

#### 开发环境
- [ ] Python 3.9+ 已安装
- [ ] Node.js 16+ 已安装
- [ ] npm 8+ 已安装
- [ ] Git 已安装
- [ ] Docker 已安装（可选）
- [ ] Docker Compose 已安装（可选）

#### 系统配置
- [ ] 1GB+ RAM 可用（对于1GB服务器）
- [ ] 40GB+ 磁盘空间
- [ ] 网络连接正常
- [ ] OpenAI API 密钥已获取

### 2. 代码准备

#### 后端检查
- [ ] `backend-ai/requirements.txt` 已存在并完整
- [ ] `backend-ai/app/main.py` 已完成 (306行)
- [ ] `backend-ai/app/models/emotion.py` 已完成 (380行)
- [ ] `backend-ai/app/services/emotion_analyzer.py` 已完成 (322行)
- [ ] `backend-ai/app/services/dapp_recommender.py` 已完成 (309行)
- [ ] `backend-ai/app/api/endpoints/emotion.py` 已完成 (385行)
- [ ] `backend-ai/app/api/endpoints/recommend.py` 已完成 (266行)
- [ ] `backend-ai/app/api/endpoints/memory.py` 已完成 (475行)
- [ ] `backend-ai/init_db.py` 已完成 (240行)

#### 前端检查
- [ ] `frontend-web/src/App.jsx` 已完成 (17行)
- [ ] `frontend-web/src/routes.jsx` 已完成 (117行)
- [ ] `frontend-web/src/pages/HomePage.jsx` 已完成 (166行)
- [ ] `frontend-web/src/pages/EmotionDetectionPage.jsx` 已完成 (208行)
- [ ] `frontend-web/src/pages/HealingStationPage.jsx` 已完成
- [ ] `frontend-web/src/pages/SoundTheatrePage.jsx` 已完成
- [ ] `frontend-web/src/pages/MusicWorkshopPage.jsx` 已完成
- [ ] `frontend-web/src/pages/VoiceAssistantPage.jsx` 已完成
- [ ] `frontend-web/src/pages/MemoryLibraryPage.jsx` 已完成
- [ ] `frontend-web/package.json` 已存在

#### 部署检查
- [ ] `deployment/docker/docker-compose.yml` 已完成
- [ ] `deployment/docker/Dockerfile.python` 已完成
- [ ] `deployment/docker/Dockerfile.nodejs` 已完成
- [ ] `deployment/docker/Dockerfile.web` 已完成
- [ ] `deployment/nginx/nginx.conf` 已完成
- [ ] `deployment/scripts/deploy.sh` 已完成
- [ ] `deployment/scripts/backup.sh` 已完成

#### 测试检查
- [ ] `backend-ai/tests/test_services.py` 已完成 (326行)
- [ ] `backend-ai/tests/test_integration.py` 已完成 (500+行)

### 3. 文档检查

- [ ] `COMPLETE_GUIDE.md` 已完成 (500+行)
- [ ] `QUICK_REFERENCE.md` 已完成 (300+行)
- [ ] `PROJECT_COMPLETION_SUMMARY.md` 已完成 (400+行)
- [ ] `README.md` 已更新
- [ ] `docs/API.md` 已完成（可选）

### 4. 脚本检查

- [ ] `start_all.py` 已完成 (250行)
- [ ] `verify_setup.py` 已完成 (300行)
- [ ] `backend-ai/init_db.py` 可执行

---

## 🔍 功能验证清单

### API端点验证

#### 情绪分析端点
- [ ] `POST /api/v1/emotion/analyze` - 分析单个情绪
- [ ] `GET /api/v1/emotion/history/{user_id}` - 获取历史
- [ ] `GET /api/v1/emotion/statistics/{user_id}` - 获取统计
- [ ] `POST /api/v1/emotion/batch-analyze` - 批量分析

#### 推荐端点
- [ ] `POST /api/v1/recommend/apps` - 获取推荐
- [ ] `POST /api/v1/recommend/personalize` - 个性化推荐
- [ ] `GET /api/v1/recommend/top` - 获取热门应用
- [ ] `POST /api/v1/recommend/feedback` - 反馈记录

#### 记忆端点
- [ ] `POST /api/v1/memory/create` - 创建记忆
- [ ] `GET /api/v1/memory/{memory_id}` - 查询记忆
- [ ] `GET /api/v1/memory/user/{user_id}/list` - 列表查询
- [ ] `PUT /api/v1/memory/{memory_id}` - 更新记忆
- [ ] `DELETE /api/v1/memory/{memory_id}` - 删除记忆
- [ ] `GET /api/v1/memory/user/{user_id}/timeline` - 时间线
- [ ] `GET /api/v1/memory/user/{user_id}/emotions/trend` - 趋势
- [ ] `GET /api/v1/memory/user/{user_id}/tags` - 标签统计
- [ ] `POST /api/v1/memory/user/{user_id}/search` - 搜索

### 前端页面验证

- [ ] 主页 (HomePage) - 加载正常，显示欢迎语
- [ ] 情绪检测页 (EmotionDetectionPage) - 支持文本/语音输入
- [ ] 声音疗愈站 (HealingStationPage) - 显示治愈内容
- [ ] 声音剧场 (SoundTheatrePage) - 显示播客内容
- [ ] AI音乐工坊 (MusicWorkshopPage) - 显示音乐工具
- [ ] 个人声音助手 (VoiceAssistantPage) - 显示助手功能
- [ ] 记忆库 (MemoryLibraryPage) - 显示情绪历史

### 数据库验证

- [ ] 数据库文件 `soundscape.db` 创建成功
- [ ] 所有必需的表都已创建:
  - [ ] `users` 表
  - [ ] `sessions` 表
  - [ ] `memory` 表
  - [ ] `dapp_history` 表
  - [ ] `dapp_recommendation` 表
  - [ ] `content_cache` 表
  - [ ] `api_usage_log` 表
- [ ] 默认DApp推荐规则已导入

### 测试验证

- [ ] 所有单元测试通过: `pytest tests/test_services.py -v`
- [ ] 所有集成测试通过: `pytest tests/test_integration.py -v`
- [ ] 代码覆盖率 > 70%: `pytest tests/ --cov=app --cov-report=html`

---

## 🚀 部署流程清单

### 本地测试部署

```bash
# 1. 环境初始化
[ ] cd backend-ai && python -m venv venv
[ ] source venv/bin/activate
[ ] pip install -r requirements.txt
[ ] cd ../frontend-web && npm install

# 2. 数据库初始化
[ ] cd ../backend-ai && python init_db.py

# 3. 验证设置
[ ] python verify_setup.py

# 4. 启动服务
[ ] python -m uvicorn app.main:app --reload --port 8000
[ ] (新终端) cd frontend-web && npm run dev

# 5. 运行测试
[ ] pytest tests/ -v

# 6. 访问应用
[ ] 前端: http://localhost:5173
[ ] API文档: http://localhost:8000/docs
```

### Docker部署

```bash
# 1. 构建镜像
[ ] cd deployment/docker
[ ] docker-compose build

# 2. 启动容器
[ ] docker-compose up -d

# 3. 验证容器
[ ] docker ps (检查所有容器运行状态)
[ ] docker-compose logs (检查日志)

# 4. 访问应用
[ ] 前端: http://localhost:80
[ ] API: http://localhost:8000/docs
```

### 云服务器部署

```bash
# 1. 系统准备
[ ] SSH连接到服务器
[ ] 检查系统版本: uname -a
[ ] 检查可用内存: free -h
[ ] 检查磁盘空间: df -h

# 2. 安装依赖
[ ] apt update && apt upgrade
[ ] apt install python3.9 python3-pip nodejs npm docker.io
[ ] systemctl start docker
[ ] usermod -aG docker $USER

# 3. 克隆项目
[ ] git clone <repo> soundscape
[ ] cd soundscape

# 4. 配置环境
[ ] export OPENAI_API_KEY=sk-...
[ ] mkdir -p logs data

# 5. 使用Docker部署
[ ] cd deployment/docker
[ ] docker-compose -f docker-compose.yml up -d

# 6. 配置Nginx
[ ] sudo cp nginx.conf /etc/nginx/sites-available/default
[ ] sudo systemctl restart nginx

# 7. 配置SSL（可选）
[ ] 安装certbot: apt install certbot python3-certbot-nginx
[ ] 获取证书: certbot certonly --nginx -d yourdomain.com
```

---

## ⚠️ 常见问题和解决方案

### 问题: Python模块导入失败

```bash
# 症状: ModuleNotFoundError: No module named 'fastapi'
# 解决:
pip install -r requirements.txt
# 或
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 问题: 数据库连接错误

```bash
# 症状: sqlite3.DatabaseError
# 解决:
cd backend-ai
rm soundscape.db  # 删除旧文件
python init_db.py  # 重新初始化
```

### 问题: 端口被占用

```bash
# 症状: Address already in use
# 解决:
# 找到占用端口的进程
lsof -i :8000  # 或 netstat -tlnp | grep 8000
# 杀死进程
kill -9 <PID>
```

### 问题: OpenAI API密钥无效

```bash
# 症状: Invalid API key provided
# 解决:
# 检查密钥
echo $OPENAI_API_KEY
# 重新设置
export OPENAI_API_KEY=sk-your_real_key
```

### 问题: 内存不足

```bash
# 症状: MemoryError 或 killed by OOM killer
# 解决:
# 减少数据库连接池大小
# 编辑 backend-ai/app/main.py:
# engine = create_engine(..., pool_size=3, max_overflow=5)

# 或增加服务器swap空间
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📊 性能验证清单

### 响应时间验证

- [ ] 情绪分析 API: <1000ms
- [ ] 应用推荐 API: <500ms
- [ ] 记忆查询 API: <500ms
- [ ] 前端页面加载: <2000ms

### 资源使用验证

- [ ] Python进程内存: <200MB
- [ ] Node进程内存: <150MB
- [ ] 数据库文件大小: <50MB
- [ ] CPU占用率: <30% (空闲时)

### 并发验证

使用Apache Bench或Wrk进行负载测试:

```bash
# 测试情绪分析端点 (100并发, 1000请求)
ab -n 1000 -c 100 -H "Content-Type: application/json" \
  -p test.json \
  http://localhost:8000/api/v1/emotion/analyze

# 结果: 应该在1GB服务器上不会过载
```

---

## 🔐 安全检查清单

- [ ] 所有敏感信息都在环境变量中（不在代码中）
- [ ] 数据库文件有适当的权限设置 (644)
- [ ] API密钥不会在日志中打印
- [ ] CORS配置正确（生产环境不应为 `*`）
- [ ] SQL注入防护: SQLAlchemy参数化查询
- [ ] CSRF防护: 正确的Cookie设置
- [ ] HTTPS配置: Nginx SSL/TLS
- [ ] 输入验证: Pydantic模型

---

## 📈 上线后监控清单

### 日志监控

```bash
# 实时查看日志
docker-compose logs -f

# 查看特定容器日志
docker-compose logs -f python-api
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看数据库大小
du -sh soundscape.db

# 查看API调用统计
sqlite3 soundscape.db "SELECT api_name, COUNT(*) as count FROM api_usage_log GROUP BY api_name;"
```

### 可用性监控

```bash
# 定期检查API健康状态
curl http://localhost:8000/docs

# 检查前端可访问性
curl -I http://localhost:80
```

---

## ✅ 最终检查

### 上线前48小时

- [ ] 所有测试通过且覆盖率 > 70%
- [ ] 所有文档已更新
- [ ] 备份脚本可正常执行
- [ ] 回滚计划已制定
- [ ] 团队成员已培训
- [ ] 监控告警已设置

### 上线日

- [ ] 在测试环境进行最后一次全流程测试
- [ ] 数据备份已完成
- [ ] 通知相关人员
- [ ] 准备好快速响应团队
- [ ] 记录上线时间和版本号

### 上线后24小时

- [ ] 监控所有指标正常
- [ ] 用户反馈收集
- [ ] 性能基准验证
- [ ] 调整配置（如需要）
- [ ] 文档更新（生产地址等）

---

## 📞 紧急联系方式

| 角色 | 联系方式 | 备注 |
|------|--------|------|
| 技术负责人 | - | - |
| DevOps | - | 服务器问题 |
| 产品负责人 | - | 业务问题 |
| OpenAI支持 | support@openai.com | API问题 |

---

## 📝 后续维护计划

### 每日
- [ ] 检查日志是否有错误
- [ ] 监控内存使用
- [ ] 检查磁盘空间

### 每周
- [ ] 查看API成本报告
- [ ] 备份数据库
- [ ] 检查用户反馈

### 每月
- [ ] 性能分析报告
- [ ] 安全审计
- [ ] 更新依赖包（if safe）

---

**最后更新**: 2024年  
**版本**: 1.0.0  
**状态**: ✅ 生产就绪

**祝部署顺利！** 🚀
