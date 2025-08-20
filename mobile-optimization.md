# 移动端优化和域名配置指南

## 1. 域名配置方案

### 方案A：使用自定义域名（推荐）

```bash
# 1. 购买域名
# 推荐：Namecheap, GoDaddy, 或 Google Domains
# 建议域名：
# - wenxinai.com
# - wenxin.ai
# - wenxin-moyun.com

# 2. 在Google Cloud Console配置
gsutil web set -m index.html -e 404.html gs://wenxin-moyun-prod-new-static

# 3. 创建负载均衡器
gcloud compute backend-buckets create wenxin-backend-bucket \
    --gcs-bucket-name=wenxin-moyun-prod-new-static

gcloud compute url-maps create wenxin-lb \
    --default-backend-bucket=wenxin-backend-bucket

gcloud compute target-https-proxies create wenxin-https-proxy \
    --url-map=wenxin-lb \
    --ssl-certificates=wenxin-ssl-cert

gcloud compute forwarding-rules create wenxin-https-rule \
    --target-https-proxy=wenxin-https-proxy \
    --ports=443 \
    --global

# 4. 配置DNS
# 在域名提供商处添加A记录指向负载均衡器IP
```

### 方案B：使用Firebase Hosting（简单快速）

```bash
# 1. 安装Firebase CLI
npm install -g firebase-tools

# 2. 初始化Firebase
firebase init hosting

# 3. 配置firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}

# 4. 部署
npm run build
firebase deploy --only hosting

# 获得域名：wenxin-moyun.web.app
```

### 方案C：使用Vercel（最简单）

```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 部署
vercel

# 自动获得域名：wenxin-moyun.vercel.app
# 可以绑定自定义域名
```

## 2. 移动端访问问题修复

### 问题1：URL分享被截断

**临时解决方案：**
```javascript
// 生成短链接
const shortUrl = await fetch('https://api.short.io/links', {
  method: 'POST',
  headers: {
    'Authorization': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    originalURL: 'https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/',
    domain: 'short.io',
    path: 'wenxinai'
  })
});
```

### 问题2：移动端兼容性优化

**添加到 index.html:**
```html
<head>
  <!-- 现有meta标签 -->
  
  <!-- 添加移动端优化 -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="format-detection" content="telephone=no">
  
  <!-- 添加Open Graph标签用于社交分享 -->
  <meta property="og:title" content="WenXin MoYun - AI艺术评测平台">
  <meta property="og:description" content="42个AI模型综合评测，探索AI创作能力边界">
  <meta property="og:image" content="/og-image.png">
  <meta property="og:url" content="https://wenxinai.com">
  
  <!-- 微信分享优化 -->
  <meta name="x5-orientation" content="portrait">
  <meta name="x5-fullscreen" content="true">
  <meta name="x5-page-mode" content="app">
</head>
```

### 问题3：CORS配置

**设置Cloud Storage CORS:**
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
# 应用CORS配置
gsutil cors set cors.json gs://wenxin-moyun-prod-new-static
```

### 问题4：移动端CSS调整

**创建 mobile-fixes.css:**
```css
/* 移动端触摸优化 */
@media (max-width: 768px) {
  /* 增大点击区域 */
  button, a {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* 禁用iOS默认样式 */
  input, textarea, button {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
  
  /* 修复iOS弹性滚动 */
  .scroll-container {
    -webkit-overflow-scrolling: touch;
  }
  
  /* 防止横向滚动 */
  body {
    overflow-x: hidden;
  }
  
  /* 调整字体大小 */
  html {
    font-size: 16px; /* 防止iOS缩放 */
  }
}
```

## 3. 快速测试移动端

```bash
# 1. 使用Chrome DevTools移动端模式
# 2. 使用真机测试
# 3. 使用BrowserStack或类似服务

# 本地测试（局域网）
npm run dev -- --host
# 手机访问: http://[你的IP]:5173
```

## 4. 推荐的立即行动计划

1. **今天**: 使用bit.ly创建短链接用于分享
2. **本周**: 购买域名（推荐 wenxinai.com）
3. **下周**: 配置Cloudflare或Vercel部署
4. **最终**: 迁移到自定义域名

## 5. 紧急修复脚本

如果移动端确实无法访问，可以创建一个简单的重定向页面：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WenXin MoYun - 跳转中...</title>
  <script>
    // 检测是否是移动端
    if (/Mobile|Android|iPhone/i.test(navigator.userAgent)) {
      // 移动端使用简化URL
      window.location.href = 'https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/';
    } else {
      // PC端正常跳转
      window.location.href = 'https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/';
    }
  </script>
</head>
<body>
  <p>正在跳转到WenXin MoYun...</p>
</body>
</html>
```

将这个页面部署到一个短域名服务上作为中转。