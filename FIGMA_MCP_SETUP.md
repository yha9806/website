# Figma MCP 配置指南

## 问题诊断

您遇到的 403 错误是因为 Figma MCP 服务器没有配置认证 Token。

## 解决步骤

### 步骤 1: 获取 Figma Personal Access Token

**重要说明**：Figma 的 Personal Access Token 界面已经更新。目前有两种获取方式：

#### 方法 A: 通过 Figma Dev Mode（推荐）
1. 登录 [Figma](https://www.figma.com)
2. 打开任意 Figma 文件
3. 在右上角切换到 **Dev Mode**
4. 点击右上角的个人头像
5. 选择 **Settings** → **Personal access tokens**
6. 点击 **Generate new token**
7. 给 token 起个名字（例如："Claude MCP Integration"）
8. 选择 token 的有效期（建议选择 "No expiration"）
9. 选择权限范围（至少需要 "Read-only" 权限）
10. 点击 **Generate token**
11. **重要**：立即复制生成的 token，它只会显示一次！

#### 方法 B: 手动访问 Token 页面（备选）
直接访问：https://www.figma.com/settings/account#personal-access-tokens
或者：
1. 登录 Figma
2. 访问：https://www.figma.com/developers/api#access-tokens
3. 点击 "Get personal access token"
4. 按照页面提示生成 token

### 步骤 2: 配置 Claude Desktop

#### 方法 A: 通过 Claude 设置界面（推荐）

1. 打开 Claude Desktop 应用
2. 按 `Ctrl + ,` 打开设置
3. 点击 **Developer** 标签
4. 在 **MCP Servers** 部分，点击 **Edit Config**
5. 这会打开 `claude_desktop_config.json` 文件

#### 方法 B: 手动找到配置文件

配置文件位置：
```
C:\Users\您的用户名\AppData\Roaming\Claude\claude_desktop_config.json
```

快速访问方法：
- 按 `Win + R`
- 输入 `%APPDATA%\Claude`
- 按回车

### 步骤 3: 编辑配置文件

将以下内容添加到 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

**注意**：
- 将 `figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 替换为您的实际 token
- Token 通常以 `figd_` 开头
- 如果文件中已有其他服务器配置，确保正确的 JSON 格式：

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "您的token"
      }
    },
    "其他服务器": {
      // 其他配置
    }
  }
}
```

### 步骤 4: 重启 Claude Desktop

1. 完全关闭 Claude Desktop
2. 重新打开 Claude Desktop
3. MCP 服务器会自动初始化

### 步骤 5: 验证配置

配置成功后，您可以使用以下 MCP 命令：
- `mcp__figma__add_figma_file` - 添加 Figma 文件
- `mcp__figma__view_node` - 查看特定节点
- `mcp__figma__read_comments` - 读取评论
- `mcp__figma__post_comment` - 发布评论

## 常见问题

### 1. 仍然收到 403 错误
- 检查 token 是否正确复制（没有多余空格）
- 确认 token 没有过期
- 验证 JSON 格式是否正确

### 2. MCP 服务器未启动
- 检查 Node.js 是否已安装
- 确保可以访问 npm registry
- 查看 Claude 的开发者控制台是否有错误信息

### 3. 无法访问特定文件
- 确认您的 Figma 账户有权访问该文件
- Community 文件应该是公开可访问的
- 私有文件需要您是成员或有查看权限

## 测试配置

配置完成后，您可以让我再次尝试访问 Figma 文件：
1. Material UI Kit: https://www.figma.com/design/7Em9D0GqIQiGER7olCNrbm/
2. iOS 16 UI Kit: https://www.figma.com/design/GaZTMdyRoF1XuNus5wzUpc/

## 备选方案

如果 MCP 配置仍有问题，我们可以：
1. 使用 Playwright 继续浏览和截图 Figma 文件
2. 基于 Material Design 3 和 iOS 16 规范手动创建组件
3. 使用公开的设计系统文档作为参考