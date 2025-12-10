# 🔧 Cloudflare R2 CORS 配置指南

## 第一步：配置 R2 CORS（必须先完成）

### 访问 Cloudflare Dashboard

1. 登录：https://dash.cloudflare.com/
2. 进入 R2 → `csv-visualizer-uploads`

### 添加 CORS 规则

1. 点击 **Settings** 标签
2. 找到 **CORS Policy** 部分
3. 点击 **Edit CORS Policy** 或 **Add CORS Policy**
4. 复制以下 JSON 配置：

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://csv-visualizer-one.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. 点击 **Save** 保存配置

### 验证 CORS 配置

配置完成后，可以通过浏览器控制台验证：

```javascript
// 在浏览器控制台运行
fetch('https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev/', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'PUT'
  }
}).then(r => console.log(r.headers.get('access-control-allow-origin')))
```

应该输出：`http://localhost:3000` 或 `*`

---

## 配置完成后

**请告知我 CORS 配置已完成**，我会立即：
1. ✅ 创建新的 API 路由生成预签名 URL
2. ✅ 修改前端上传逻辑
3. ✅ 部署并测试

---

## 常见问题

### Q: 如果找不到 CORS Policy 选项？

**A**: 确保您在正确的桶设置页面：
- R2 → csv-visualizer-uploads → Settings 标签
- 向下滚动找到 "CORS Policy"

### Q: CORS 配置后需要等待生效吗？

**A**: 通常立即生效，最多等待 1-2 分钟

### Q: 可以添加更多域名吗？

**A**: 可以，在 `AllowedOrigins` 数组中添加：
```json
"AllowedOrigins": [
  "http://localhost:3000",
  "https://csv-visualizer-one.vercel.app",
  "https://your-custom-domain.com"
]
```

---

**配置完成后请告诉我，我会继续下一步！**
