# 🔑 R2 桶策略配置（解决 403 Access Denied）

## 问题诊断

**测试结果**：
- ✅ CORS 配置正确（OPTIONS 请求成功）
- ✅ API 生成预签名 URL 成功
- ❌ **PUT 上传返回 403 Forbidden**

**错误信息**：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>AccessDenied</Code>
  <Message>Access Denied</Message>
</Error>
```

**根本原因**：R2 桶缺少允许匿名 PUT 操作的访问策略。

---

## 🎯 解决方案：配置桶策略

### 步骤 1：登录 Cloudflare
访问：https://dash.cloudflare.com/

### 步骤 2：进入 R2 桶设置
```
R2 → csv-visualizer-uploads → Settings → Bucket Policy
```

### 步骤 3：添加桶策略

点击 **"Edit Bucket Policy"**，粘贴以下 JSON：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPresignedUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
    },
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
    }
  ]
}
```

### 策略说明

**Statement 1 - 允许预签名上传**：
- `Principal: "*"`：允许任何人（通过预签名 URL 验证）
- `Action: s3:PutObject`：允许上传文件
- `Resource: .../*`：应用到桶内所有文件

**Statement 2 - 允许公开读取**：
- 允许通过公共 URL 访问已上传的文件
- 用于后续下载历史文件

### 步骤 4：保存并等待生效

1. 点击 **"Save"**
2. 等待 1-2 分钟让策略生效
3. 重新测试上传

---

## 🧪 验证配置

### 方法 1：命令行测试

```bash
bash /tmp/test-r2-upload.sh
```

**期望输出**：
```
[步骤 4] 执行 PUT 上传...
HTTP/1.1 200 OK
✅ 上传成功!
```

### 方法 2：浏览器测试

1. 访问：https://csv-visualizer-one.vercel.app
2. 打开开发者工具（F12）
3. 上传 CSV 文件
4. 检查 Network 标签中的 PUT 请求
5. 应该返回 **200 OK**

---

## 📋 完整配置检查清单

确保以下两项都已配置：

### ✅ 1. CORS 策略（已完成）
```json
{
  "AllowedOrigins": [
    "http://localhost:3000",
    "https://csv-visualizer-one.vercel.app"
  ],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*", "Content-Type", "x-amz-*", "Authorization"],
  "ExposeHeaders": ["ETag", "Content-Length"],
  "MaxAgeSeconds": 3600
}
```

### ⏳ 2. 桶策略（待配置）
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
    },
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
    }
  ]
}
```

---

## 🔒 安全说明

**问：允许 `Principal: "*"` 安全吗？**

**答**：是的，因为：
1. **预签名 URL 机制**：
   - 只有通过我们的 API 生成的预签名 URL 才能上传
   - URL 包含 AWS 签名验证，无法伪造
   - 15 分钟自动过期

2. **没有直接暴露凭证**：
   - 用户无法直接访问 R2 API
   - 必须通过我们的 API 端点获取预签名 URL
   - API 可以添加额外的验证逻辑

3. **可选增强安全**：
   - 限制文件大小（已有 100MB 限制）
   - 限制文件类型（已限制为 CSV）
   - 添加用户认证到 API 端点

---

## 🆘 如果仍然失败

### 检查项：

1. **确认桶名称正确**：
   - 资源 ARN 中的桶名必须是 `csv-visualizer-uploads`
   - 不要有拼写错误

2. **检查账户 ID**：
   - 确认在正确的 Cloudflare 账户中配置

3. **查看 Cloudflare 审计日志**：
   - R2 → Audit Logs
   - 查找 PUT 请求被拒绝的详细原因

4. **测试单个操作**：
   ```bash
   # 测试 API 生成 URL
   curl -X POST https://csv-visualizer-one.vercel.app/api/get-upload-url \
     -H "Content-Type: application/json" \
     -d '{"fileName":"test.csv","fileSize":100,"contentType":"text/csv"}'

   # 使用返回的 URL 手动测试 PUT
   curl -X PUT "<返回的 uploadUrl>" \
     -H "Content-Type: text/csv" \
     --data-binary @/tmp/test-upload.csv \
     -i
   ```

---

## 📸 Cloudflare 界面参考

**桶策略部分应该显示**：
```
Bucket Policy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Define access policies for this bucket.

[Current Bucket Policy]
{
  "Version": "2012-10-17",
  "Statement": [...]
}

[Edit Bucket Policy]  [Delete Bucket Policy]
```

---

## ✅ 配置完成后

请告诉我以下信息：
1. 桶策略是否成功保存？
2. 重新运行测试脚本的结果（200 OK 还是 403？）
3. 浏览器上传是否成功？

---

**配置这个桶策略后，上传功能应该就能正常工作了！** 🚀
