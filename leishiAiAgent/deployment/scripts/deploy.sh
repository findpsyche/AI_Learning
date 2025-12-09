
# ==========================================
# deployment/scripts/deploy.sh
# ==========================================

#!/bin/bash

# AI情感伴侣系统部署脚本

set -e

echo "🚀 开始部署 AI Emotion Companion System..."

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请复制 .env.example 并填入配置"
    exit 1
fi

# 加载环境变量
export $(cat .env | xargs)

# 检查OpenAI API Key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ 错误: OPENAI_API_KEY 未设置"
    exit 1
fi

echo "✅ 环境变量检查完成"

# 构建前端
echo "📦 构建前端..."
cd frontend/mobile-h5
npm install
npm run build
cd ../..

echo "✅ 前端构建完成"

# 启动Docker服务
echo "🐳 启动Docker服务..."
cd deployment/docker
docker-compose down
docker-compose up -d --build

echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."

# 检查Node.js
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Node.js服务运行正常"
else
    echo "❌ Node.js服务启动失败"
fi

# 检查FastAPI
if curl -f http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ FastAPI服务运行正常"
else
    echo "❌ FastAPI服务启动失败"
fi

# 检查Nginx
if curl -f http://localhost/ > /dev/null 2>&1; then
    echo "✅ Nginx服务运行正常"
else
    echo "❌ Nginx服务启动失败"
fi

echo ""
echo "🎉 部署完成!"
echo ""
echo "访问地址:"
echo "  前端: http://localhost"
echo "  Node.js API: http://localhost:3000"
echo "  FastAPI: http://localhost:8000"
echo ""
echo "查看日志:"
echo "  docker-compose logs -f nodejs-server"
echo "  docker-compose logs -f fastapi-agent"
echo ""

