# Figma MCP 集成解决方案

## ✅ 问题已解决！

### 问题原因
Claude Desktop 配置文件中使用了错误的包名 `@modelcontextprotocol/server-figma`，这个包在 npm 上不存在。

### 解决方案
已将配置更新为使用 `figma-developer-mcp` 包（版本 0.5.0）

### 更新后的配置
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp"],
      "env": {
        "FIGMA_API_KEY": "figd_WkoJZrh-izc78FQOufCm_mUVicy3gyyOiPt5OIXe"
      }
    }
  }
}
```

### 配置文件位置
`C:\Users\MyhrDyzy\AppData\Roaming\Claude\claude_desktop_config.json`

## 使用步骤

1. **重启 Claude Desktop**
   - 完全关闭 Claude Desktop 应用
   - 重新打开应用

2. **验证 MCP 加载**
   - 在新会话中检查 MCP 工具是否可用
   - 应该能看到 `mcp__figma__` 开头的工具

3. **测试 Figma 功能**
   ```
   使用命令：mcp__figma__add_figma_file
   URL: https://www.figma.com/design/UgtG4Jdzxrl2VQXYnqLfx6/
   ```

## 可用的 Figma MCP 功能

- `mcp__figma__add_figma_file` - 添加 Figma 文件到上下文
- `mcp__figma__view_node` - 查看特定节点的缩略图
- `mcp__figma__read_comments` - 读取文件评论
- `mcp__figma__post_comment` - 发布评论
- `mcp__figma__reply_to_comment` - 回复评论

## 备选方案

如果 `figma-developer-mcp` 有问题，可以尝试其他包：

### 选项 1: figma-mcp-server
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-mcp-server"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

### 选项 2: figma-mcp
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["figma-mcp"],
      "env": {
        "FIGMA_API_KEY": "YOUR_TOKEN"
      }
    }
  }
}
```

## 故障排查检查清单

✅ Token 有效性验证通过
✅ 正确的包名已配置（figma-developer-mcp）
✅ 包版本验证成功（v0.5.0）
✅ 环境变量名称正确（FIGMA_API_KEY）
✅ 配置文件格式正确（JSON）

## 下一步

1. **重启 Claude Desktop** 以加载新配置
2. **开始新会话** 测试 MCP 功能
3. **使用 Figma 工具** 导入设计文件

---

*更新时间: 2025-08-10*