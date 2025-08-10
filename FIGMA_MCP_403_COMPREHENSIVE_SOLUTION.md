# Figma MCP 403错误全面解决方案

## 问题诊断

您遇到的403错误（Forbidden）表示Figma API拒绝了访问请求。根据调查，这个问题的根本原因是：

### 主要原因分析

1. **文件访问权限问题**
   - 您尝试访问的文件（QXOBuLdzm7zy2CSnGqArEl）可能是私有文件
   - 即使是Microsoft的Fluent Emoji文件，原始设计文件可能有访问限制
   - Community文件和原始文件的权限是分开的

2. **Token权限不足**
   - 您的Token只有"File content (Read-only)"权限
   - 某些文件即使是只读权限也需要特定的访问授权
   - Personal Access Token无法访问所有文件，只能访问您有权限的文件

3. **API调用格式问题**
   - Figma API需要使用`X-Figma-Token`头部，而不是`Authorization: Bearer`
   - MCP工具可能使用了错误的认证格式

## 解决方案

### 方案1：复制文件到您的账户（推荐）

**步骤：**
1. 登录Figma网页版：https://www.figma.com
2. 访问原始文件：https://www.figma.com/design/QXOBuLdzm7zy2CSnGqArEl/
3. 如果提示无权限，搜索Figma Community中的公开版本：
   - Microsoft Fluent Design Emojis: https://www.figma.com/community/file/997937112813242349
   - Fluent emoji — 1: https://www.figma.com/community/file/1138254942249677742
4. 点击"Open in Figma"或"Duplicate"将文件复制到您的Drafts
5. 复制后的文件URL会变成您自己的文件ID
6. 使用新的文件URL与MCP工具交互

### 方案2：确保Token配置正确

**检查清单：**
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_eoWZ5lMY1TUz0w_KVQdJbCz_RkLQpnD84Md5If6i"
      }
    }
  }
}
```

**注意事项：**
- 确保Token没有过期（您的Token到2025年9月10日过期）
- Token必须完整复制，没有额外空格
- 重启Claude Code使配置生效

### 方案3：生成新的Token（如果需要）

**步骤：**
1. 访问：https://www.figma.com/settings
2. 点击"Personal access tokens"
3. 生成新Token，确保选择：
   - Expiration: 90 days或更长
   - Scopes: File content (至少Read权限)
4. 立即复制Token（只显示一次）
5. 更新MCP配置文件

### 方案4：使用替代方法访问Figma文件

**替代工具：**
1. **Figma REST API直接调用**
   ```bash
   curl -H "X-Figma-Token: figd_eoWZ5lMY1TUz0w_KVQdJbCz_RkLQpnD84Md5If6i" \
        https://api.figma.com/v1/files/YOUR_FILE_ID
   ```

2. **Figma Plugin**
   - 安装Microsoft Fluent UI Emoji Set插件
   - 直接在Figma中使用，无需API访问

3. **下载资源包**
   - 访问：https://github.com/microsoft/fluentui-emoji
   - 直接下载SVG/PNG资源文件

### 方案5：验证文件访问权限

**测试步骤：**
1. 先测试您自己的文件：
   - 在Figma中创建新文件
   - 获取文件URL
   - 使用MCP工具测试访问

2. 测试公开文件：
   - 使用已知的公开Community文件
   - 确认Token基本功能正常

3. 逐步排查：
   - 如果自己的文件可以访问，说明Token配置正确
   - 如果公开文件也无法访问，可能是MCP工具问题

## 具体错误代码解释

### 403 Forbidden
- **含义**：服务器理解请求但拒绝授权
- **Figma特定原因**：
  - 文件需要特定团队/组织成员身份
  - Token过期或无效
  - 文件被删除或设为私有
  - API调用频率限制

### 解决优先级

1. **立即尝试**：复制文件到您的账户（方案1）
2. **如果失败**：检查Token配置（方案2）
3. **备选方案**：使用插件或下载资源（方案4）
4. **最后手段**：生成新Token（方案3）

## 成功标志

当您成功解决问题后，应该能够：
- 使用`mcp__figma__add_figma_file`添加文件
- 使用`mcp__figma__view_node`查看节点
- 使用`mcp__figma__read_comments`读取评论

## 额外建议

1. **保存工作文件ID**：成功复制文件后，记录新的文件ID
2. **定期更新Token**：在过期前更新，避免工作中断
3. **使用Team文件**：如果有Figma团队，将文件移到团队中更容易管理权限
4. **文档记录**：记录哪些文件可以访问，方便后续使用

## 相关资源

- [Figma API文档](https://www.figma.com/developers/api)
- [MCP Figma Server](https://github.com/TimHolden/figma-mcp-server)
- [Microsoft Fluent Emoji GitHub](https://github.com/microsoft/fluentui-emoji)
- [Figma Help Center](https://help.figma.com)

---

最后更新：2025-08-11
问题状态：已提供完整解决方案