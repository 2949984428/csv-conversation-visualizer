# 🔍 R2 权限配置详解

## 您已配置的设置

### ✅ Public Development URL
- **位置**: R2 → csv-visualizer-uploads → Settings → Public Access
- **作用**: 允许任何人**读取**已上传的文件
- **URL**: `https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev`
- **权限**: 只有 `s3:GetObject`（下载）

**这个设置等同于**：
```json
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::csv-visualizer-uploads/*"
}
```

---

## ❌ 缺少的配置：上传权限

### Public Development URL 的局限

**Public Development URL 只允许**：
- ✅ 读取文件（GET）
- ✅ 列出文件（LIST，如果启用）

**不允许**：
- ❌ 上传文件（PUT） ← **这就是问题所在！**
- ❌ 删除文件（DELETE）
- ❌ 修改文件（POST）

---

## 🎯 解决方案：额外配置桶策略

即使开启了 Public Development URL，您仍需要添加**桶策略**来允许 PUT 操作。

### 为什么需要单独配置？

Cloudflare R2 的权限系统分为两层：

1. **Public Access Settings**（公共访问设置）
   - 只能控制读取权限（GET）
   - UI 界面简单配置

2. **Bucket Policy**（桶策略）
   - 精细控制所有操作（PUT/DELETE/POST/GET）
   - 需要手动编写 JSON 策略

---

## 📋 完整配置步骤

### 步骤 1：保持 Public Development URL 开启
✅ 您已完成此步骤

### 步骤 2：添加桶策略

1. 在同一个 Settings 页面，找到 **"Bucket Policy"** 部分
2. 点击 **"Edit Bucket Policy"** 或 **"Add Bucket Policy"**
3. 粘贴以下 JSON：

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
    }
  ]
}
```

4. 点击 **"Save"**

### 步骤 3：等待生效
- 等待 1-2 分钟
- 清除浏览器缓存

---

## 🔐 安全性说明

### 问：为什么需要 `Principal: "*"`？

**答**：这个配置是**安全的**，因为：

1. **预签名 URL 机制保护**：
   ```
   用户 → 我们的 API → 验证 → 生成带签名的临时 URL → 用户上传
   ```
   - 只有通过我们 API 生成的 URL 才能上传
   - URL 包含 AWS 签名，无法伪造
   - 15 分钟后自动过期

2. **API 层面可以增加控制**：
   ```javascript
   // 在 /api/get-upload-url.js 中可以添加：
   - 用户认证检查
   - 文件大小限制（已有）
   - 文件类型限制（已有）
   - 上传频率限制
   - IP 白名单
   ```

3. **对比直接暴露凭证**：
   - ❌ 不安全：在前端直接使用 R2_ACCESS_KEY_ID
   - ✅ 安全：前端只能通过 API 获取临时 URL

---

## 🧪 验证配置

### 方法 1：命令行测试

```bash
bash /tmp/test-r2-upload.sh
```

**配置前（当前状态）**：
```
[步骤 4] 执行 PUT 上传...
HTTP/1.1 403 Forbidden
❌ 403 Forbidden - CORS 或权限问题
```

**配置后（期望结果）**：
```
[步骤 4] 执行 PUT 上传...
HTTP/1.1 200 OK
✅ 上传成功!
```

### 方法 2：浏览器测试

1. 访问：https://csv-visualizer-one.vercel.app
2. 上传 CSV 文件
3. 检查控制台
4. 应该看到：`[R2] 文件已上传到云端: https://pub-...`

---

## 📊 R2 权限配置对比表

| 配置项 | Public Development URL | Bucket Policy | 组合效果 |
|--------|----------------------|---------------|----------|
| **读取（GET）** | ✅ 允许 | 可选 | ✅ 允许 |
| **上传（PUT）** | ❌ 不允许 | ✅ 需要配置 | ✅ 允许 |
| **删除（DELETE）** | ❌ 不允许 | ✅ 需要配置 | ✅ 允许 |
| **配置难度** | 简单（UI 界面） | 中等（JSON） | - |

---

## 🔍 Cloudflare 界面位置

### Settings 页面应该有两个部分：

```
┌─────────────────────────────────────────┐
│ Settings - csv-visualizer-uploads       │
├─────────────────────────────────────────┤
│                                         │
│ Public Access                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [✓] Allow Access                        │
│ Public Development URL:                 │
│ https://pub-c227...r2.dev              │
│                                ← 您已配置 │
├─────────────────────────────────────────┤
│                                         │
│ Bucket Policy                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Define access policies for this bucket. │
│                                         │
│ [Add Bucket Policy] 或 [Edit...]       │
│                                ← 需要配置 │
└─────────────────────────────────────────┘
```

---

## 🆘 如果找不到 "Bucket Policy" 部分

### 可能的原因：

1. **界面位置**：
   - 向下滚动 Settings 页面
   - 可能在 "CORS Policy" 下方

2. **账户权限**：
   - 确认您有管理员权限
   - 某些旧版账户可能没有此功能

3. **备用方法**：
   - 联系 Cloudflare 支持
   - 或者使用 Wrangler CLI 配置：
   ```bash
   wrangler r2 bucket update csv-visualizer-uploads \
     --policy @bucket-policy.json
   ```

---

## 📝 总结

**当前状态**：
- ✅ Public Development URL 已开启（允许读取）
- ✅ CORS 已配置（允许跨域请求）
- ❌ **缺少 PUT 权限**（需要桶策略）

**下一步**：
1. 在 R2 Settings 页面找到 "Bucket Policy"
2. 添加上面的 JSON 策略（允许 `s3:PutObject`）
3. 保存并等待 1-2 分钟
4. 重新测试上传

**配置完成后，上传功能应该就能正常工作了！** 🚀

---

## 📸 需要帮助？

如果您在 Cloudflare 界面中找不到 "Bucket Policy" 选项，请截图发给我：
1. R2 桶的 Settings 页面完整截图
2. 我会帮您找到正确的配置位置
