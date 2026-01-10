# Cloud Shell Import Instructions

## 快速导入步骤

1. 打开 Google Cloud Console
2. 启动 Cloud Shell (右上角终端图标)
3. 克隆代码并导入数据：

```bash
# 克隆最新代码
git clone https://github.com/your-repo/website.git
cd website/wenxin-backend

# 安装依赖
pip install -r requirements.txt -c constraints.txt

# 设置环境变量
export ENVIRONMENT=production
export DATABASE_URL="postgresql+asyncpg://postgres:Qnqwdn7800@/wenxin?host=/cloudsql/wenxin-moyun-prod-new:asia-east1:wenxin-postgres"

# 运行导入脚本
python production_import.py
```

## 预期结果

脚本将会：
1. 清理生产数据库中的旧数据（28个模型）
2. 导入新的28个模型数据，包含：
   - 完整的测试响应内容
   - 各维度评分详情
   - 高亮（highlights）和弱点（weaknesses）
3. 验证导入成功并显示Top 5模型

## 数据验证

导入完成后，访问生产网站验证：
- https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/

检查以下内容：
- 模型排行榜显示正确的28个模型
- 每个模型显示实际的测试响应
- iOS液态玻璃效果正确展示highlights和weaknesses