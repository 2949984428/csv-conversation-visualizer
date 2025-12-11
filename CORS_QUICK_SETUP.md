# ⚡ 快速配置 CORS（仅需 3 分钟）

## 当前状态
- ✅ API 路由正常工作（已获取到预签名 URL）
- ✅ 预签名 URL 生成成功
- ⏳ **需要配置 CORS 才能完成上传**

---

## 📋 快速配置步骤

### 1. 登录 Cloudflare
访问：https://dash.cloudflare.com/

### 2. 进入 R2 桶设置
导航路径：
```
R2 → csv-visualizer-uploads → Settings
```

### 3. 找到 CORS Policy
向下滚动找到 **"CORS Policy"** 部分

### 4. 点击 "Edit CORS Policy" 或 "Add CORS Policy"

### 5. 粘贴以下配置
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

### 6. 保存配置

### 7. 等待生效（通常立即生效，最多 1-2 分钟）

---

## 🧪 验证配置

配置完成后：

1. **刷新浏览器页面**（Cmd/Ctrl + Shift + R）

2. **重新上传文件**

3. **检查控制台输出**
   - 应该看到：
   ```
   [R2] 开始客户端直传: your-file.csv (XX.X MB)
   [R2] 获取到预签名 URL，开始上传...
   [R2] 文件已上传到云端: https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev/...
   ```

4. **验证 R2 桶**
   - 访问 Cloudflare Dashboard
   - 进入 R2 → csv-visualizer-uploads
   - 应该能看到上传的文件

---

## ❓ 常见问题

### Q: 找不到 CORS Policy 选项？

**位置**：
- R2（左侧菜单）
- → csv-visualizer-uploads（点击桶名称）
- → Settings（顶部标签）
- → 向下滚动到 "CORS Policy" 部分

### Q: 配置后还是报错？

1. 确认 JSON 格式正确（无多余逗号）
2. 清除浏览器缓存并硬性刷新（Cmd/Ctrl + Shift + R）
3. 等待 1-2 分钟让配置生效

### Q: 可以添加更多域名吗？

可以！在 `AllowedOrigins` 数组中添加：
```json
"AllowedOrigins": [
  "http://localhost:3000",
  "https://csv-visualizer-one.vercel.app",
  "https://your-custom-domain.com"
]
```

---

## 🎯 配置完成后

**请告诉我 CORS 配置已完成**，然后：
1. 我们一起测试大文件上传
2. 验证功能正常工作
3. 完成所有文档更新

---

## 📸 配置截图参考

Cloudflare R2 CORS 配置页面应该类似这样：

```
Settings 标签页
├── Bucket Configuration
├── R2.dev Subdomain
├── Custom Domains
└── CORS Policy  ← 在这里配置
    └── [Edit CORS Policy] 按钮
```

---

**预计耗时：3 分钟**
**难度：简单（复制粘贴 JSON）**

配置完成后请告知，我们立即测试！🚀
