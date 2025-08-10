# 🔧 Figma MCP 手动修复指南

## 问题确认
您的Figma Token缺少`current_user:read`权限，这是导致403错误的根本原因。

## 立即修复步骤

### 步骤1：生成新Token（必须）

1. **打开Figma设置**
   - 浏览器访问：https://www.figma.com/settings
   - 或在Figma中：点击头像 → Settings

2. **找到Personal Access Tokens**
   - 左侧菜单："Personal access tokens"
   - 或直接访问：https://www.figma.com/settings#personal-access-tokens

3. **生成新Token**
   点击 "Generate new token" 按钮

4. **配置Token（重要！）**
   ```
   Token名称: Claude_MCP_Full_Access
   过期时间: 90 days
   
   权限（全部勾选）：
   ☑️ current_user:read（必需）
   ☑️ file_content:read
   ☑️ file_content:write
   ☑️ file_variables:read  
   ☑️ file_variables:write
   ☑️ file_comments:read
   ☑️ file_comments:write
   ☑️ webhooks:write
   ☑️ library_analytics:read
   ☑️ file_dev_resources:read
   ☑️ file_dev_resources:write
   ☑️ code_connect:write（如果可用）
   ```

5. **复制Token**
   - 点击"Generate token"
   - **立即复制！**（只显示一次）
   - 保存到安全位置

### 步骤2：验证新Token

打开命令提示符，测试Token：
```cmd
curl -H "X-Figma-Token: 你的新Token" https://api.figma.com/v1/me
```

成功响应应包含您的邮箱：
```json
{
  "id": "...",
  "email": "yuhaorui88@gmail.com",
  "handle": "yu hr"
}
```

### 步骤3：更新MCP配置

#### 方法A：使用批处理脚本（推荐）
运行我创建的脚本：
```cmd
I:\website\fix_figma_token.bat
```

#### 方法B：手动配置
```cmd
# 移除旧配置
claude mcp remove figma

# 添加新配置
claude mcp add figma -- cmd /c npx -y @modelcontextprotocol/server-figma

# 设置Token
claude mcp update figma --env FIGMA_PERSONAL_ACCESS_TOKEN=你的新Token
```

### 步骤4：重启Claude Code

```cmd
# 关闭Claude Code
taskkill /F /IM claude.exe

# 重新启动
claude
```

### 步骤5：验证配置

在Claude Code中：
```cmd
claude mcp health figma
```

应显示：✓ Connected

## 替代方案

### 如果官方MCP不工作，使用社区版

1. **figma-developer-mcp（针对Cursor优化）**
   ```cmd
   claude mcp add figma -- cmd /c npx -y figma-developer-mcp --figma-api-key=你的Token --stdio
   ```

2. **TimHolden版本（更多功能）**
   ```cmd
   npm install -g figma-mcp
   claude mcp add figma -- figma-mcp --token 你的Token
   ```

## 常见问题

### Q: 为什么需要current_user:read权限？
A: 这是Figma API的基础认证权限，用于验证Token有效性。

### Q: Token过期了怎么办？
A: 重新生成新Token，建议选择90天或更长时间。

### Q: 组织账户有限制？
A: 某些权限可能需要组织管理员批准，联系您的Figma管理员。

### Q: 仍然403错误？
A: 检查：
1. Token是否包含所有权限
2. 文件是否在您的账户中
3. 是否使用了正确的文件ID

## 测试清单

- [ ] 新Token包含current_user:read权限
- [ ] curl测试/v1/me端点成功
- [ ] MCP配置已更新
- [ ] Claude Code已重启
- [ ] mcp health显示Connected
- [ ] 可以使用mcp__figma__工具

## 支持资源

- Figma API文档：https://www.figma.com/developers/api
- Claude Code MCP：https://docs.anthropic.com/en/docs/claude-code/mcp
- 社区论坛：https://forum.figma.com

---
更新时间：2025-08-11
状态：已提供完整手动修复方案