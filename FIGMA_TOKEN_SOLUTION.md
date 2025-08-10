# ✅ 找到问题根源！Figma Token权限不足

## 🔍 诊断结果

通过API测试，发现您的Token问题：
```
错误: Invalid scope(s): file_content:read. This endpoint requires the current_user:read scope
```

**您的Token只有`file_content:read`权限，但缺少其他必要权限！**

## 🎯 立即解决方案

### 第1步：生成新的Token（必须）

1. **打开Figma设置页面**
   ```
   https://www.figma.com/settings
   ```

2. **点击"Personal access tokens"**

3. **生成新Token时，选择以下所有权限：**
   - ✅ **current_user:read** - 读取用户信息（必需）
   - ✅ **file_content:read** - 读取文件内容
   - ✅ **file_variables:read** - 读取变量
   - ✅ **file_variables:write** - 写入变量
   - ✅ **file_comments:read** - 读取评论
   - ✅ **file_comments:write** - 写入评论
   - ✅ **webhooks:write** - Webhook权限
   - ✅ **library_analytics:read** - 库分析
   - ✅ **file_dev_resources:read** - 开发资源读取
   - ✅ **file_dev_resources:write** - 开发资源写入
   - ✅ **code_connect:write** - Code Connect权限（如果可用）

4. **Token设置：**
   - 名称：`Claude_MCP_Full_2025`
   - 过期时间：**90天**
   - 描述：`Full access for Claude Code MCP integration`

5. **立即复制新Token**（只显示一次！）

### 第2步：更新配置文件

保存新Token到文件：
```bash
# 更新FIGMA_TOKEN.txt
echo "新Token内容" > I:\website\FIGMA_TOKEN_NEW.txt
```

### 第3步：重新配置MCP

#### 方法A：使用命令行（推荐）
```bash
# 1. 移除旧配置
claude mcp remove figma

# 2. 添加新配置（Windows专用命令）
claude mcp add figma -- cmd /c npx -y @modelcontextprotocol/server-figma

# 3. 设置环境变量
claude mcp update figma --env FIGMA_PERSONAL_ACCESS_TOKEN=你的新Token
```

#### 方法B：直接编辑配置文件
```json
{
  "servers": {
    "figma": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "你的新Token这里"
      }
    }
  }
}
```

### 第4步：验证新Token

```bash
# 测试用户信息（必须成功）
curl -H "X-Figma-Token: 新Token" https://api.figma.com/v1/me

# 测试文件访问
curl -H "X-Figma-Token: 新Token" https://api.figma.com/v1/files/QXOBuLdzm7zy2CSnGqArEl
```

### 第5步：重启Claude Code

```bash
# Windows命令
taskkill /F /IM claude.exe
claude
```

## ⚠️ 重要提醒

### 为什么之前的Token不工作？

您在2025-08-11生成Token时：
- ❌ 只选择了"File content (Read-only)"
- ❌ 缺少"current_user:read"基础权限
- ❌ 缺少其他API操作权限

### 新Token必须包含的最小权限集：
1. `current_user:read` - 基础认证
2. `file_content:read` - 读取文件
3. `file_variables:read` - 读取设计变量
4. `file_comments:read` - 读取评论

## 🚀 快速验证脚本

创建测试脚本`test_figma.bat`：
```batch
@echo off
echo Testing Figma Token...
set TOKEN=你的新Token

echo.
echo 1. Testing /me endpoint...
curl -s -H "X-Figma-Token: %TOKEN%" https://api.figma.com/v1/me | findstr "email"

echo.
echo 2. Testing file access...
curl -s -H "X-Figma-Token: %TOKEN%" https://api.figma.com/v1/files/QXOBuLdzm7zy2CSnGqArEl | findstr "name"

echo.
echo 3. Testing MCP connection...
claude mcp health figma

pause
```

## 📋 检查清单

- [ ] 生成包含所有权限的新Token
- [ ] 保存Token到安全位置
- [ ] 更新MCP配置
- [ ] 测试API直接访问
- [ ] 重启Claude Code
- [ ] 测试MCP功能

## 🎉 成功标志

新Token配置成功后：
1. `curl /v1/me` 返回您的用户信息
2. `claude mcp health figma` 显示Connected
3. `mcp__figma__add_figma_file` 不再返回403

## 📞 如果仍有问题

1. 确认Figma账户类型（免费/付费）
2. 检查组织权限设置
3. 尝试使用不同浏览器生成Token
4. 联系Figma支持确认账户权限

---
诊断时间：2025-08-11
问题状态：已找到根本原因，提供解决方案