# 🎯 R2 桶策略手动配置指南

## 问题总结

测试发现上传失败的根本原因是：**R2 桶缺少 PUT 权限策略**

- ✅ CORS 配置正确
- ✅ API 生成预签名 URL 正常
- ✅ Public Development URL 已开启（允许读取）
- ❌ **桶策略未配置**（不允许 PUT 上传）

---

## 📋 手动配置步骤（推荐）

### 步骤 1：登录 Cloudflare

访问：https://dash.cloudflare.com/

输入您的邮箱和密码登录。

---

### 步骤 2：进入 R2 桶设置

```
左侧菜单：R2 Object Storage
→ 点击桶名称：csv-visualizer-uploads
→ 顶部标签：Settings
```

---

### 步骤 3：找到 Bucket Policy 部分

在 Settings 页面向下滚动，找到以下两个配置区域：

```
┌─────────────────────────────────────────┐
│ Public Access                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [✓] Allow Access                        │
│ Public Development URL:                 │
│ https://pub-c227...r2.dev              │
│                                ← 已配置 │
├─────────────────────────────────────────┤
│                                         │
│ Bucket Policy                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Define access policies for this bucket. │
│                                         │
│ [Add Bucket Policy] 或 [Edit Policy]   │
│                                ← 点这里 │
└─────────────────────────────────────────┘
```

---

### 步骤 4：添加桶策略

1. 点击 **"Add Bucket Policy"** 或 **"Edit Bucket Policy"** 按钮

2. 在弹出的文本框中，**删除所有内容**，然后粘贴以下 JSON：

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

3. 点击 **"Save"** 或 **"Update"** 按钮

4. 确认看到成功消息（通常是绿色提示框）

---

### 步骤 5：验证配置已保存

1. 刷新页面
2. 再次查看 "Bucket Policy" 部分
3. 应该显示您刚才保存的策略

---

## 🧪 测试上传功能

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

---

### 方法 2：浏览器测试

1. 访问：https://csv-visualizer-one.vercel.app
2. 点击上传 CSV 文件
3. 打开开发者工具（F12）→ Console 标签
4. 应该看到：
   ```
   [R2] 开始客户端直传: filename.csv (X.XX MB)
   [R2] 获取到预签名 URL，开始上传...
   [R2] 文件已上传到云端: https://pub-...
   ```

---

## 🔍 策略说明

### Statement 1: AllowPresignedUploads
```json
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": ["s3:PutObject"],
  "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
}
```

**作用**：允许任何持有有效预签名 URL 的人上传文件

**安全性**：
- ✅ 预签名 URL 包含 AWS 签名，无法伪造
- ✅ URL 在 15 分钟后自动过期
- ✅ 只能通过我们的 API 生成 URL
- ✅ API 可以添加额外验证（用户认证、文件大小限制等）

---

### Statement 2: AllowPublicRead
```json
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
}
```

**作用**：允许任何人下载已上传的文件

**说明**：
- 这个配置等同于您已开启的 "Public Development URL"
- 确保用户可以通过公共 URL 访问历史上传的文件

---

## ❓ 常见问题

### Q1: 为什么需要 `Principal: "*"`？

**A**: 这是预签名 URL 机制的标准配置：

```
用户 → API → 验证 → 生成带签名的 URL → 用户直接上传到 R2
                                ↑
                        这一步需要 Principal: "*"
```

如果不设置 `Principal: "*"`，预签名 URL 将无法工作（403 错误）。

---

### Q2: 这样配置安全吗？

**A**: 是的，因为：

1. **预签名 URL 有签名保护**：
   - 包含 `X-Amz-Signature` 参数
   - 基于密钥、时间戳、文件路径计算
   - 无法伪造或猜测

2. **有时间限制**：
   - 15 分钟后自动失效
   - 无法重复使用过期的 URL

3. **API 层面可控**：
   ```javascript
   // 在 /api/get-upload-url.js 中可以添加：
   - 用户认证（检查 JWT Token）
   - IP 白名单
   - 上传频率限制（Rate Limiting）
   - 文件类型验证（已有）
   - 文件大小限制（已有 100MB）
   ```

---

### Q3: 如果不想公开读取怎么办？

**A**: 删除 Statement 2，或修改为需要签名的读取：

```json
{
  "Statement": [
    {
      "Sid": "AllowPresignedUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
    }
    // 删除 AllowPublicRead
  ]
}
```

然后需要修改前端，使用预签名 GET URL 来下载文件。

---

### Q4: 配置后还是 403 错误怎么办？

**可能的原因**：

1. **配置未保存成功**
   - 刷新页面确认策略显示在界面上

2. **配置传播延迟**
   - 等待 2-3 分钟
   - 清除浏览器缓存（Cmd/Ctrl + Shift + R）
   - 使用无痕模式测试

3. **JSON 格式错误**
   - 确认没有多余的逗号
   - 使用 JSON 验证器：https://jsonlint.com/

4. **桶名称错误**
   - 确认 Resource 中的桶名是 `csv-visualizer-uploads`
   - 不要有拼写错误

---

### Q5: 如何查看当前生效的策略？

在 Settings 页面，"Bucket Policy" 部分应该显示完整的 JSON 策略。

如果显示 "No bucket policy configured"，说明策略未保存成功。

---

## 🆘 需要帮助？

如果按照上述步骤操作后仍然失败，请提供以下截图：

1. **Cloudflare Settings 页面**：
   - 显示 "Bucket Policy" 部分的完整截图

2. **浏览器开发者工具**：
   - Network 标签
   - 找到失败的 PUT 请求
   - 点击查看 Headers 和 Response

3. **命令行测试结果**：
   ```bash
   bash /tmp/test-r2-upload.sh
   ```
   的完整输出

---

## 📝 配置检查清单

配置完成后，请确认：

- [ ] 在 Cloudflare Settings 页面看到 "Bucket Policy"
- [ ] 策略 JSON 包含 `AllowPresignedUploads` 和 `AllowPublicRead`
- [ ] 点击 Save 后看到成功消息
- [ ] 刷新页面后策略仍然显示
- [ ] 等待 2-3 分钟让配置生效
- [ ] 清除浏览器缓存
- [ ] 运行测试脚本返回 200 OK
- [ ] 浏览器上传成功

---

## ✅ 配置完成

完成上述步骤后，您的 R2 桶将拥有：

1. ✅ CORS 配置（允许跨域请求）
2. ✅ 公共读取权限（Public Development URL）
3. ✅ 预签名上传权限（Bucket Policy）

上传功能应该完全正常工作，可以处理任意大小的 CSV 文件（最大 100MB）！

---

**祝配置成功！如有问题请随时联系。** 🚀
