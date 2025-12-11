# 🔧 CORS 配置完整版本

## 问题分析

经过完整分析，发现问题：

1. ✅ CORS 配置已生效（curl 测试成功）
2. ✅ API 路由正常工作（获取到预签名 URL）
3. ❌ 浏览器 PUT 请求被阻止

**根本原因**：Cloudflare R2 的 CORS 配置需要包含更多的头信息，特别是 AWS 签名相关的头。

---

## 🎯 正确的 CORS 配置

请使用以下**完整版本**的 CORS 配置：

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
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*",
      "Content-Type",
      "Content-MD5",
      "Content-Disposition",
      "x-amz-*",
      "Authorization"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-MD5",
      "x-amz-request-id"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 关键变化：

1. **添加 DELETE 方法**
2. **明确列出 AWS 相关头**：
   - `x-amz-*`：所有 AWS/S3 签名头
   - `Authorization`：AWS 签名
   - `Content-MD5`：完整性校验
   - `Content-Disposition`：文件元数据

3. **ExposeHeaders 添加**：
   - `x-amz-request-id`：用于调试
   - `Content-MD5`：校验和

---

## 🔄 配置步骤

### 1. 登录 Cloudflare
https://dash.cloudflare.com/

### 2. 导航到桶设置
```
R2 → csv-visualizer-uploads → Settings → CORS Policy
```

### 3. 替换现有配置
- 点击 "Edit CORS Policy"
- **删除旧配置**
- 粘贴上面的完整配置
- 点击 "Save"

### 4. 等待生效
- 等待 2-3 分钟
- 清除浏览器缓存
- 使用无痕模式测试

---

## 🧪 验证方法

### 测试 1：OPTIONS 预检请求
```bash
curl -X OPTIONS \
  -H "Origin: https://csv-visualizer-one.vercel.app" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type,x-amz-meta-original-name" \
  -i "https://csv-visualizer-uploads.bc19681f5c65cc1581d746eca6f0c4e6.r2.cloudflarestorage.com/test.csv"
```

**期望输出**：
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://csv-visualizer-one.vercel.app
Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
Access-Control-Allow-Headers: *, Content-Type, x-amz-*, Authorization
```

### 测试 2：实际上传
1. 访问：https://csv-visualizer-one.vercel.app
2. 打开无痕窗口
3. 上传 CSV 文件
4. 检查控制台输出

---

## 🔍 如果仍然失败

### 调试步骤：

1. **打开浏览器开发者工具**
2. **切换到 Network 标签**
3. **上传文件**
4. **查找 OPTIONS 请求**（预检请求）
5. **检查响应头**

**需要看到的头信息**：
```
Access-Control-Allow-Origin: https://csv-visualizer-one.vercel.app
Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
Access-Control-Allow-Headers: * (或包含 x-amz-*)
Access-Control-Max-Age: 3600
```

**如果缺少这些头**，说明：
- CORS 配置未保存
- 或配置未生效
- 或配置位置错误

### 截图请求：

请提供以下截图：
1. Cloudflare R2 Settings → CORS Policy 页面
2. 浏览器 Network 标签中的 OPTIONS 请求详情
3. OPTIONS 响应的 Headers 标签

---

## 📝 备注

**为什么需要这些额外的头？**

AWS S3 预签名 URL 在浏览器中上传时会自动添加：
- `x-amz-content-sha256`：内容哈希
- `x-amz-date`：请求时间
- `x-amz-meta-*`：自定义元数据
- `x-amz-sdk-checksum-algorithm`：校验算法

如果 CORS 配置不允许这些头，浏览器会拒绝发送请求。

---

**请使用上述完整配置替换现有 CORS 配置，然后告诉我结果！** 🚀
