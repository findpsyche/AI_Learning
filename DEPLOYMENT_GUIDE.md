# 🚀 声景 Soundscape 部署指南

## 📋 目录
1. [环境要求](#环境要求)
2. [腾讯云 CVM 部署](#腾讯云-cvm-部署)
3. [Docker 部署](#docker-部署)
4. [OpenAI API 配置](#openai-api-配置)
5. [故障排除](#故障排除)
6. [性能优化](#性能优化)

---

## 环境要求

### 硬件要求
- **最低配置**: 1GB 内存, 2核 CPU (腾讯云 1核2GB 标准)
- **推荐配置**: 2GB 内存, 4核 CPU

### 软件要求
- Docker & Docker Compose 20.10+
- Node.js 18+ (如果本地开发)
- Python 3.11+ (如果本地开发)

---

## 腾讯云 CVM 部署

### 第一步: 购买 CVM 服务器

1. 登录[腾讯云控制台](https://console.cloud.tencent.com/)
2. 选择"云服务器 CVM" → "实例"
3. 配置:
   - **地域**: 根据用户位置选择 (如上海)
   - **可用区**: 随机选择
   - **镜像**: Ubuntu 22.04 LTS
   - **实例类型**: 1核 2GB 内存 (标准型 S5)
   - **系统盘**: 50GB SSD
   - **公网带宽**: 1Mbps

### 第二步: 连接到服务器

```bash
# SSH 连接
ssh -i your-key.pem ubuntu@your-server-ip

# 或使用密码登录
ssh root@your-server-ip
```

### 第三步: 安装 Docker

```bash
# 更新系统
sudo apt-get update
sudo apt-get upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 第四步: 克隆项目

```bash
# 克隆项目
git clone https://github.com/findpsyche/soundscape.git
cd soundscape

# 创建环境配置
cp .env.example .env

# 编辑 .env 文件，填入 OpenAI API Key
nano .env
```

### 第五步: 构建和启动容器

```bash
# 进入 Docker 目录
cd deployment/docker

# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 检查服务状态
docker-compose ps
```

### 第六步: 配置 Nginx SSL

```bash
# 申请 SSL 证书 (使用 Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx -y

# 申请证书
sudo certbot certonly --standalone -d your-domain.com

# 配置自动续期
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 第七步: 配置防火墙

```bash
# 开放必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## Docker 部署

### 快速启动

```bash
# 1. 构建所有镜像
docker-compose build

# 2. 启动所有服务
docker-compose up -d

# 3. 查看运行状态
docker-compose ps

# 4. 查看实时日志
docker-compose logs -f

# 5. 停止服务
docker-compose down

# 6. 清理所有数据
docker-compose down -v
```

### 服务架构

```
┌─────────────────────────────────────────────┐
│           Nginx (Reverse Proxy)             │
│    Port 80 (HTTP) / 443 (HTTPS)            │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────┼──────────┐
    │         │          │
┌───▼──┐  ┌──▼────┐  ┌──▼───────┐
│ Web  │  │Node.js│  │ Python   │
│ 静态 │  │ WS    │  │ FastAPI  │
│ 文件 │  │ 3000  │  │  8000    │
└──────┘  └───────┘  └──────────┘
```

### 容器网络

- **网络名称**: `soundscape-network`
- **驱动**: Bridge
- **容器通信**: 内部域名 DNS

### 数据持久化

```
volumes:
  - ./logs/nginx:/var/log/nginx          # Nginx 日志
  - ./logs/nodejs:/app/logs              # Node.js 日志
  - ./logs/python:/app/logs              # Python 日志
  - ./database:/app/database             # 数据库文件
  - ./storage:/app/storage               # 用户数据存储
```

---

## OpenAI API 配置

### 获取 API Key

1. 访问 [OpenAI 平台](https://platform.openai.com/account/api-keys)
2. 创建新的 API Key
3. 复制 Key 到 `.env` 文件

### API Key 安全

```bash
# 方法1: 通过环境变量
export OPENAI_API_KEY=sk-xxx

# 方法2: 通过 .env 文件 (推荐)
echo "OPENAI_API_KEY=sk-xxx" >> .env

# 方法3: Docker Secrets (生产环境)
echo "sk-xxx" | docker secret create openai_key -
```

### 使用 OpenAI 功能

#### 1. 语音转文字 (Whisper)

```bash
curl -X POST http://localhost:8000/api/v1/openai/transcribe \
  -F "file=@audio.mp3" \
  -F "language=zh"
```

#### 2. 文本生成 (GPT-4)

```bash
curl -X POST http://localhost:8000/api/v1/openai/generate-text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "讲一个关于友谊的故事",
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

#### 3. 文本转语音 (TTS)

```bash
curl -X POST http://localhost:8000/api/v1/openai/synthesize-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，这是一条测试消息",
    "voice": "nova",
    "speed": 1.0
  }'
```

#### 4. 完整语音聊天

```bash
curl -X POST http://localhost:8000/api/v1/openai/voice-chat \
  -F "file=@voice.m4a" \
  -F "emotion=happy" \
  -F "context=我正在听音乐"
```

---

## 监控和日志

### 查看日志

```bash
# 所有服务日志
docker-compose logs -f

# 特定服务日志
docker-compose logs -f nodejs-server
docker-compose logs -f python-server
docker-compose logs -f nginx

# 实时跟踪
docker-compose logs -f --tail=100
```

### 性能监控

```bash
# 查看容器资源占用
docker stats

# 进入容器调试
docker exec -it soundscape-nodejs sh
docker exec -it soundscape-python bash
```

### 健康检查

```bash
# 检查 Node.js 服务
curl http://localhost:3000/api/health

# 检查 Python 服务
curl http://localhost:8000/health

# 检查 Nginx
curl http://localhost/
```

---

## 故障排除

### 1. 容器启动失败

```bash
# 查看具体错误
docker-compose logs nodejs-server

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 2. OpenAI API 错误

```
错误: "OPENAI_API_KEY environment variable not set"
解决: 
  1. 检查 .env 文件中是否有 OPENAI_API_KEY
  2. 重启容器: docker-compose restart
```

### 3. 内存不足

```bash
# 查看容器内存使用
docker stats

# 停止不必要的服务
docker-compose stop python-server

# 增加虚拟内存
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 4. 数据库连接错误

```bash
# 检查数据库文件
ls -la ./database/

# 重新初始化数据库
docker exec soundscape-python python init_db.py
```

### 5. SSL 证书过期

```bash
# 续期证书
sudo certbot renew

# 强制续期
sudo certbot renew --force-renewal
```

---

## 性能优化

### 1. 内存优化

```yaml
# docker-compose.yml
services:
  nodejs-server:
    deploy:
      resources:
        limits:
          memory: 256M
  python-server:
    deploy:
      resources:
        limits:
          memory: 512M
```

### 2. 进程优化

```bash
# 增加 Node.js 工作线程
export UV_THREADPOOL_SIZE=128

# 调整 Python 进程
export PYTHONOPTIMIZE=2
```

### 3. 数据库优化

```sql
-- SQLite WAL 模式 (更快)
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;  -- 64MB 缓存
```

### 4. Nginx 缓存

```nginx
# nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;

location ~ ^/api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 10m;
}
```

---

## 更新部署

### 更新代码

```bash
# 拉取最新代码
git pull origin master

# 重新构建镜像
docker-compose build

# 重启服务
docker-compose up -d
```

### 备份数据

```bash
# 备份数据库
docker exec soundscape-python cp /app/database/soundscape.db /app/database/backups/soundscape_$(date +%s).db

# 备份用户数据
tar -czf storage_backup_$(date +%Y%m%d).tar.gz ./storage/
```

---

## 生产环境检查清单

- [ ] OpenAI API Key 已配置
- [ ] SSL 证书已安装
- [ ] 防火墙已配置
- [ ] 备份策略已确定
- [ ] 监控日志已设置
- [ ] 自动续期证书已启用
- [ ] 容器资源限制已设置
- [ ] 定期更新计划已制定

---

## 支持和帮助

- 📖 文档: [docs/DEPLOYMENT.md](../DEPLOYMENT.md)
- 🐛 问题报告: [GitHub Issues](https://github.com/findpsyche/soundscape/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/findpsyche/soundscape/discussions)

**祝部署顺利！** 🎉
