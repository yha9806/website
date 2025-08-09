# 文心墨韵 - 生产环境部署指南

## 系统要求

- Ubuntu 20.04+ / CentOS 8+ / 其他Linux发行版
- Docker 20.10+
- Docker Compose 2.0+
- 至少2GB RAM
- 至少10GB可用磁盘空间

## 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/wenxin-moyun.git
cd wenxin-moyun
```

### 2. 配置环境变量

```bash
cp .env.production .env
nano .env  # 编辑并设置你的生产环境配置
```

**必须配置的变量：**
- `DB_PASSWORD`: 数据库密码（请使用强密码）
- `SECRET_KEY`: JWT密钥（至少32个字符的随机字符串）
- `API_BASE_URL`: API的公网地址

### 3. 运行部署脚本

首次部署（包含初始数据）：
```bash
chmod +x deploy.sh
./deploy.sh --init
```

后续更新部署：
```bash
./deploy.sh
```

### 4. 配置SSL证书（推荐）

使用Let's Encrypt免费证书：
```bash
# 安装certbot
sudo apt-get update
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 证书会保存在 /etc/letsencrypt/live/yourdomain.com/
```

## 手动部署步骤

### 1. 安装Docker和Docker Compose

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 构建镜像

```bash
docker-compose -f docker-compose.prod.yml build
```

### 3. 启动服务

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. 初始化数据库

```bash
# 运行迁移
docker exec wenxin_backend alembic upgrade head

# 初始化示例数据（可选）
docker exec wenxin_backend python init_db.py
```

## 服务管理

### 查看服务状态
```bash
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志
```bash
# 所有服务
docker-compose -f docker-compose.prod.yml logs -f

# 特定服务
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### 停止服务
```bash
docker-compose -f docker-compose.prod.yml stop
```

### 重启服务
```bash
docker-compose -f docker-compose.prod.yml restart
```

### 完全停止并删除容器
```bash
docker-compose -f docker-compose.prod.yml down
```

## 备份与恢复

### 数据库备份
```bash
# 备份
docker exec wenxin_postgres pg_dump -U wenxin wenxin_db > backup_$(date +%Y%m%d).sql

# 恢复
docker exec -i wenxin_postgres psql -U wenxin wenxin_db < backup_20240101.sql
```

### 完整备份（包括上传的文件）
```bash
# 创建备份
tar -czf wenxin_backup_$(date +%Y%m%d).tar.gz \
  ./uploads \
  backup_$(date +%Y%m%d).sql

# 恢复
tar -xzf wenxin_backup_20240101.tar.gz
```

## 监控

### 资源使用情况
```bash
docker stats
```

### 健康检查
```bash
# API健康检查
curl http://localhost:8001/api/v1/health

# 前端检查
curl http://localhost
```

## 性能优化

### 1. 数据库优化
编辑 `docker-compose.prod.yml`，添加PostgreSQL配置：
```yaml
postgres:
  environment:
    POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    POSTGRES_HOST_AUTH_METHOD: md5
  command: 
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "max_connections=200"
```

### 2. Redis缓存
确保在`.env`中启用Redis：
```
USE_REDIS=true
REDIS_URL=redis://redis:6379
```

### 3. Nginx缓存
前端静态资源已配置1年缓存期

## 故障排除

### 容器无法启动
```bash
# 查看详细错误
docker-compose -f docker-compose.prod.yml logs backend
```

### 数据库连接失败
```bash
# 检查数据库容器
docker exec -it wenxin_postgres psql -U wenxin -d wenxin_db
```

### 端口被占用
```bash
# 查找占用端口的进程
sudo lsof -i :8001
sudo lsof -i :80

# 修改docker-compose.prod.yml中的端口映射
```

## 安全建议

1. **使用强密码**：确保所有密码至少16个字符
2. **定期更新**：保持Docker和依赖包最新
3. **限制访问**：配置防火墙只开放必要端口
4. **备份策略**：设置自动定期备份
5. **监控告警**：配置异常监控和告警
6. **HTTPS**：生产环境必须使用SSL证书

## 扩展部署

### 使用Kubernetes
项目包含k8s配置文件（待添加）：
```bash
kubectl apply -f k8s/
```

### 使用云服务
- **阿里云**：使用容器服务ACK
- **腾讯云**：使用容器服务TKE
- **AWS**：使用ECS或EKS

## 技术支持

遇到问题请提交Issue：
https://github.com/yourusername/wenxin-moyun/issues