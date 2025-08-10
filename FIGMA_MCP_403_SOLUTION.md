# Figma MCP 403错误解决方案

## 问题描述
尝试通过Figma MCP添加文件时遇到403 Forbidden错误，即使文件已经复制到个人账户下。

## 复制的文件信息
- **原始Community文件**: https://www.figma.com/design/zW4YiiYiP5Ti3xmUWczARv/Fluent-emoji-%E2%80%94-1--Community-
- **复制后的文件**: https://www.figma.com/design/QXOBuLdzm7zy2CSnGqArEl/Fluent-emoji-%E2%80%94-1--Community---Copy-
- **文件已成功复制到你的账户下**

## 解决步骤

### 1. 生成新的Figma Personal Access Token

1. 访问 [Figma Settings](https://www.figma.com/settings)
2. 滚动到 "Personal access tokens" 部分
3. 点击 "Generate new token"
4. 给Token命名（例如：`Claude MCP`）
5. 确保选择了 **"File content: Read"** 权限
6. 点击 "Generate token"
7. **立即复制Token**（只显示一次！）

### 2. 配置MCP服务器

找到你的MCP配置文件，通常位于：
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

更新配置为以下内容之一：

#### 方法A：使用命令行参数（推荐）
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": [
        "-y",
        "figma-developer-mcp",
        "--figma-api-key=你的TOKEN替换这里",
        "--stdio"
      ]
    }
  }
}
```

#### 方法B：使用环境变量
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["figma-developer-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "你的TOKEN替换这里"
      }
    }
  }
}
```

### 3. 重启Claude Desktop

1. 完全关闭Claude Desktop应用
2. 重新打开Claude Desktop
3. 在聊天中输入 `/mcp` 确认Figma服务器已连接

### 4. 测试访问

使用复制后的文件URL测试：
```
https://www.figma.com/design/QXOBuLdzm7zy2CSnGqArEl/Fluent-emoji-%E2%80%94-1--Community---Copy-
```

## 常见问题排查

### 如果仍然遇到403错误：

1. **确认Token权限**：
   - Token必须有"File content: Read"权限
   - 重新生成一个新Token

2. **检查文件权限**：
   - 确保你已登录Figma
   - 确保文件在你的账户下（已完成）

3. **验证MCP配置**：
   - 检查配置文件JSON格式是否正确
   - 确保Token没有多余的空格或换行

4. **使用官方Figma Dev Mode MCP**（可选）：
   - 从Figma桌面应用启用Dev Mode MCP
   - 访问 http://127.0.0.1:3845/mcp

## 替代方案

如果MCP仍无法工作，可以：
1. 直接在Figma网页版中查看设计
2. 使用Figma API手动获取文件信息
3. 导出设计资源为图片格式

## 需要的操作

1. **生成新的Personal Access Token**（最重要）
2. **更新MCP配置文件**，添加Token
3. **重启Claude Desktop**
4. **重新尝试添加文件**

Token示例格式：`figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`