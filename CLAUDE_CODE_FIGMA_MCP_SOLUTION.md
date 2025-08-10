# Claude Code Figma MCP 403错误完整解决方案

## 问题总结
您在使用Claude Code的Figma MCP工具时遇到403权限错误，即使文件已复制到个人账户并设置了共享链接。

## 根本原因分析

根据深入调查，您遇到的问题是由以下几个因素共同导致的：

### 1. MCP服务器类型混淆
您当前使用的是社区版`figma-mcp`（TimHolden版本），而不是官方的`@modelcontextprotocol/server-figma`。

### 2. Token权限范围问题
您的Token创建时只有"File content (Read-only)"权限，但根据2025年最新要求，需要：
- **File content**: Read权限
- **Dev Mode MCP**: Server config权限（如果使用官方版）
- **Code Connect**: Write权限（如果需要代码功能）

### 3. Windows特定问题
在Windows系统上，MCP服务器配置需要特殊处理，特别是使用`cmd /c`包装器。

## 立即可行的解决方案

### 方案1：重新生成Token（推荐）

1. **访问Figma设置**
   ```
   https://www.figma.com/settings
   ```

2. **生成新的Personal Access Token**
   - 名称：`Claude_MCP_Full_Access`
   - 过期时间：90天或更长
   - **重要**：选择所有可用的权限范围
   - 立即复制Token（只显示一次）

3. **更新MCP配置**
   ```bash
   # 先移除现有配置
   claude mcp remove figma
   
   # 使用新Token重新添加（Windows命令）
   claude mcp add figma -- cmd /c npx -y @modelcontextprotocol/server-figma
   ```

4. **在环境变量中设置Token**
   ```json
   {
     "env": {
       "FIGMA_PERSONAL_ACCESS_TOKEN": "你的新Token"
     }
   }
   ```

### 方案2：使用替代MCP服务器

**选项A：官方Dev Mode MCP（需要付费计划）**
```bash
# 需要Figma Desktop运行
claude mcp add --transport sse figma http://127.0.0.1:3845/sse
```

**选项B：社区优化版figma-developer-mcp（免费）**
```bash
claude mcp add figma -- cmd /c npx -y figma-developer-mcp --figma-api-key=你的Token --stdio
```

**选项C：继续使用现有figma-mcp但修复配置**
```bash
# 检查当前配置
claude mcp health figma

# 重新配置环境变量
claude mcp update figma --env FIGMA_ACCESS_TOKEN=你的新Token
```

### 方案3：直接API测试（诊断用）

先测试Token是否有效：
```bash
# 测试基本认证
curl -H "X-Figma-Token: figd_eoWZ5lMY1TUz0w_KVQdJbCz_RkLQpnD84Md5If6i" https://api.figma.com/v1/me

# 测试文件访问
curl -H "X-Figma-Token: figd_eoWZ5lMY1TUz0w_KVQdJbCz_RkLQpnD84Md5If6i" https://api.figma.com/v1/files/QXOBuLdzm7zy2CSnGqArEl
```

## 具体配置步骤（Windows）

### 步骤1：检查当前MCP配置文件
```bash
# 查看配置文件位置
claude mcp config --show-path

# 通常在：
# %APPDATA%\claude\mcp\config.json
```

### 步骤2：手动编辑配置文件
```json
{
  "servers": {
    "figma": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "你的新Token"
      }
    }
  }
}
```

### 步骤3：重启Claude Code
```bash
# 完全关闭Claude Code
taskkill /F /IM claude.exe

# 重新启动
claude
```

### 步骤4：验证连接
```bash
claude mcp health figma
```

## 已知问题和解决方法

### 问题1：超时问题
Claude Code和Figma MCP都会在一段时间后超时。解决方法：
- 定期重启两个应用
- 使用时先重启确保新连接

### 问题2：WSL兼容性
如果使用WSL，需要配置镜像网络模式：
```bash
# .wslconfig
[wsl2]
networkingMode=mirrored
```

### 问题3：Token显示Connected但仍403
这通常表示Token范围不足：
1. 撤销旧Token
2. 重新生成包含所有权限的新Token
3. 清除缓存并重新配置

## 验证成功的标志

成功配置后，您应该能够：
1. `claude mcp health figma` 显示 ✓ Connected
2. 使用`mcp__figma__add_figma_file`不再返回403
3. 能够查看节点和读取评论

## 替代工作流程

如果MCP持续有问题，建议：

1. **使用Figma Desktop的Dev Mode**
   - 直接在Figma中工作
   - 使用内置的Dev Mode功能

2. **使用Playwright自动化**
   - 您已经成功使用Playwright访问Figma
   - 可以继续使用这种方法进行自动化操作

3. **使用REST API直接调用**
   - 绕过MCP，直接使用curl或Python脚本

## 社区资源

- [Figma论坛相关讨论](https://forum.figma.com/ask-the-community-7/api-mcp-failed-dev-mode-mcp-successful-vs-code-claude-code-43509)
- [GitHub figma-mcp Issues](https://github.com/TimHolden/figma-mcp-server/issues)
- [Claude Code MCP文档](https://docs.anthropic.com/en/docs/claude-code/mcp)

## 最终建议

1. **立即行动**：生成新Token，包含所有权限
2. **测试顺序**：先用curl测试API，再配置MCP
3. **备选方案**：如果MCP不稳定，使用Playwright或直接API
4. **长期方案**：考虑升级到Figma付费计划使用官方Dev Mode MCP

---
更新时间：2025-08-11
状态：已提供完整解决方案和多种备选方案