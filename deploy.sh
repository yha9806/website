#!/bin/bash

# 生产环境部署脚本
# Production deployment script for 文心墨韵

set -e

echo "========================================="
echo "文心墨韵 Production Deployment"
echo "========================================="

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.production to .env and update with your values"
    exit 1
fi

# 加载环境变量
source .env

# 拉取最新代码
echo "📦 Pulling latest code..."
git pull origin main

# 构建和启动服务
echo "🚀 Building and starting services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ Waiting for services to start..."
sleep 10

# 运行数据库迁移
echo "🗄️ Running database migrations..."
docker exec wenxin_backend alembic upgrade head

# 初始化数据（仅首次部署）
if [ "$1" == "--init" ]; then
    echo "📊 Initializing database with sample data..."
    docker exec wenxin_backend python init_db.py
fi

# 健康检查
echo "🔍 Performing health check..."
curl -f http://localhost:8001/api/v1/health || exit 1
curl -f http://localhost || exit 1

echo "========================================="
echo "✅ Deployment completed successfully!"
echo "========================================="
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost"
echo "  API Docs: http://localhost:8001/docs"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"