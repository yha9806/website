# Figma MCP 故障排查指南

## 诊断结果

### ✅ 已验证的部分

1. **Token 有效性**: ✅ 通过
   ```bash
   curl -H "X-Figma-Token: figd_WkoJZrh-izc78FQOufCm_mUVicy3gyyOiPt5OIXe" "https://api.figma.com/v1/me"
   # 返回: 用户信息 (yuhaorui88@gmail.com)
   ```

2. **文件访问权限**: ✅ 通过
   ```bash
   curl -H "X-Figma-Token: figd_WkoJZrh-izc78FQOufCm_mUVicy3gyyOiPt5OIXe" "https://api.figma.com/v1/files/7Em9D0GqIQiGER7olCNrbm" --head
   # 返回: HTTP 200 OK
   ```

3. **配置文件位置**: ✅ 正确
   ```
   C:\Users\MyhrDyzy\AppData\Roaming\Claude\claude_desktop_config.json
   ```

### ❌ 问题所在

MCP 服务器返回 403 错误，但直接 API 调用成功，说明：
- MCP 服务器没有正确加载 Token
- Claude 会话缓存了旧的配置

## 解决方案

### 方案 1: 完全重启 Claude（推荐）

1. **完全关闭 Claude Desktop**
   ```powershell
   # 在 PowerShell 中运行
   Get-Process | Where-Object {$_.ProcessName -like "*Claude*"} | Stop-Process -Force
   ```

2. **清除 npm 缓存**
   ```bash
   npm cache clean --force
   ```

3. **删除临时 MCP 服务器实例**
   ```powershell
   # 清理临时文件
   Remove-Item -Path "$env:TEMP\mcp-*" -Recurse -Force -ErrorAction SilentlyContinue
   ```

4. **重新启动 Claude Desktop**

5. **开始新会话**
   - 重要：必须开始全新的对话会话

### 方案 2: 手动测试 MCP 服务器

1. **直接运行 MCP 服务器测试**
   ```bash
   set FIGMA_PERSONAL_ACCESS_TOKEN=figd_WkoJZrh-izc78FQOufCm_mUVicy3gyyOiPt5OIXe
   npx @modelcontextprotocol/server-figma
   ```

2. **如果上述命令成功，说明是 Claude 集成问题**

### 方案 3: 使用替代配置格式

更新 `claude_desktop_config.json` 为：

```json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": [
        "C:\\Users\\MyhrDyzy\\AppData\\Roaming\\npm\\node_modules\\@modelcontextprotocol\\server-figma\\dist\\index.js"
      ],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_WkoJZrh-izc78FQOufCm_mUVicy3gyyOiPt5OIXe"
      }
    }
  }
}
```

### 方案 4: 检查 Windows 环境变量

1. **设置系统环境变量**
   ```powershell
   [System.Environment]::SetEnvironmentVariable("FIGMA_PERSONAL_ACCESS_TOKEN", "figd_WkoJZrh-izc78FQOufCm_mUVicy3gyyOiPt5OIXe", "User")
   ```

2. **重启 Claude Desktop**

## 临时解决方案

如果 MCP 仍然无法工作，我们可以：

1. **使用 API 直接获取数据**
   ```bash
   # 获取文件数据
   curl -H "X-Figma-Token: YOUR_TOKEN" "https://api.figma.com/v1/files/FILE_KEY" > figma_data.json
   ```

2. **继续使用 Playwright 浏览器方式**

## 验证检查清单

- [ ] Claude Desktop 完全关闭并重启
- [ ] 新的对话会话已开始
- [ ] 配置文件在正确位置
- [ ] Token 包含在配置中
- [ ] 没有防火墙阻止 npm/npx
- [ ] Node.js 已安装且可用

## 日志位置

检查 Claude 日志以获取更多信息：
- Windows: `%APPDATA%\Claude\logs\`

## 联系支持

如果问题持续，可能需要：
1. 更新 Claude Desktop 到最新版本
2. 联系 Anthropic 支持报告 MCP 集成问题