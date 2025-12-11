# 🔧 CORS 配置故障排查

## 当前问题
上传文件时仍然收到 CORS 错误：
```
Access to fetch at 'https://csv-visualizer-uploads.bc19681f5c65cc1581d746eca6f0c4e6.r2.cloudflarestorage.com/...'
from origin 'https://csv-visualizer-one.vercel.app'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

---

## 📋 详细配置步骤

### 步骤 1：登录 Cloudflare
访问：https://dash.cloudflare.com/

### 步骤 2：定位到正确位置
```
左侧菜单：R2
→ 点击桶名称：csv-visualizer-uploads
→ 顶部标签：Settings
→ 向下滚动找到：CORS Policy
```

### 步骤 3：检查当前配置
**重要**：先检查 CORS Policy 部分是否有现有配置

- 如果显示 "No CORS policy configured"，点击 **"Add CORS Policy"**
- 如果已有配置，点击 **"Edit CORS Policy"**

### 步骤 4：粘贴正确的 JSON 配置

**方案 A：推荐配置（特定域名）**
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

**方案 B：如果方案 A 不工作，使用通配符（测试用）**
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 步骤 5：保存并验证

1. 点击 **"Save"** 或 **"Update"** 按钮
2. 确认看到成功消息
3. 刷新页面，确认配置已保存

---

## 🔍 常见错误

### 错误 1：JSON 格式错误
**症状**：保存时显示错误
**原因**：JSON 格式不正确（多余逗号、缺少引号等）
**解决**：使用 JSON 验证器检查格式：https://jsonlint.com/

### 错误 2：配置位置错误
**症状**：保存成功但仍然报 CORS 错误
**原因**：配置在错误的位置（如 R2.dev 子域而非桶）
**解决**：确保在 **桶的 Settings** 标签中配置

### 错误 3：配置未生效
**症状**：配置正确但仍报错
**原因**：
- 浏览器缓存
- CDN 缓存
- 配置传播延迟

**解决**：
1. 硬刷新浏览器（Cmd/Ctrl + Shift + R）
2. 清除浏览器缓存
3. 等待 5-10 分钟
4. 尝试无痕模式

---

## 🧪 验证配置

### 方法 1：使用 curl 命令
```bash
curl -X OPTIONS \
  -H "Origin: https://csv-visualizer-one.vercel.app" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type" \
  -i "https://csv-visualizer-uploads.bc19681f5c65cc1581d746eca6f0c4e6.r2.cloudflarestorage.com/"
```

**期望输出**：
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://csv-visualizer-one.vercel.app
Access-Control-Allow-Methods: GET, PUT, POST, HEAD
Access-Control-Allow-Headers: *
```

### 方法 2：使用浏览器开发者工具
1. 打开 https://csv-visualizer-one.vercel.app
2. 打开开发者工具（F12）
3. 切换到 Network 标签
4. 上传文件
5. 查找 OPTIONS 请求
6. 检查响应头是否包含 `Access-Control-Allow-Origin`

---

## 📸 Cloudflare 界面参考

### CORS Policy 部分应该显示：
```
CORS Policy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configure CORS rules for this bucket.

[Current CORS Policy]
{
  "AllowedOrigins": [...],
  "AllowedMethods": [...],
  ...
}

[Edit CORS Policy]  [Delete CORS Policy]
```

---

## 🆘 如果仍然不工作

### 请提供以下信息：

1. **Cloudflare CORS 配置截图**
   - 显示完整的 CORS Policy 内容

2. **控制台完整错误信息**
   - Network 标签中的 OPTIONS 请求详情
   - Headers 标签中的 Response Headers

3. **确认配置位置**
   - 您是在哪个页面配置的 CORS？
   - 页面 URL 是什么？

4. **桶信息**
   - 桶名称：csv-visualizer-uploads
   - Account ID：bc19681f5c65cc1581d746eca6f0c4e6
   - 确认这些信息是否正确？

---

## 🔑 关键检查点

- [ ] 在正确的桶（csv-visualizer-uploads）中配置
- [ ] 在 Settings 标签下的 CORS Policy 部分
- [ ] JSON 格式完全正确（无多余逗号）
- [ ] 保存后看到成功消息
- [ ] 等待至少 2-3 分钟
- [ ] 硬刷新浏览器（Cmd/Ctrl + Shift + R）
- [ ] 尝试无痕模式

---

## 💡 临时解决方案

如果 CORS 配置持续有问题，我们可以临时使用后端代理方式：

1. 客户端上传到我们的 API
2. API 转发到 R2（绕过 CORS）
3. 缺点：受 Vercel 4.5MB 限制

但这是备用方案，首先还是要解决 CORS 配置问题。

---

**请按照上述步骤重新检查配置，并告诉我您看到的具体情况！** 🔍
