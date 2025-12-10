# 📦 Cloudflare R2 配置指南

## 前置条件

- ✅ 已有 Cloudflare 账号
- ✅ 已有 R2 API 凭证（Account ID、Access Key、Secret Key）
- ⏳ 需要创建 R2 存储桶

---

## 步骤 1：登录 Cloudflare Dashboard

1. 访问：https://dash.cloudflare.com/
2. 使用您的账号登录
3. 确认您的 Account ID 为：`bc19681f5c65cc1581d746eca6f0c4e6`

---

## 步骤 2：创建 R2 存储桶

### 2.1 进入 R2 页面

1. 在 Cloudflare Dashboard 左侧菜单中找到 **"R2"**
2. 如果没有看到，可能需要先启用 R2 服务（免费套餐每月有 10GB 存储）

### 2.2 创建新桶

1. 点击 **"Create bucket"** 按钮
2. 填写以下信息：
   ```
   Bucket name: csv-visualizer-uploads
   Location: Automatic (自动选择最近的数据中心)
   ```
3. 点击 **"Create bucket"**

### 2.3 配置公共访问（重要！）

创建桶后，需要启用公共访问：

1. 进入刚创建的桶 `csv-visualizer-uploads`
2. 点击 **"Settings"** 标签
3. 找到 **"Public Access"** 部分
4. 点击 **"Allow Access"** 或 **"Connect Domain"**
5. 选择 **"R2.dev subdomain"**（会自动生成一个 `pub-xxxxx.r2.dev` 域名）
6. 复制生成的公共 URL（类似 `https://pub-3816599c0a1d44a2b6fbcffcbb9509b9.r2.dev`）

---

## 步骤 3：验证 API 凭证

### 3.1 检查现有凭证

您当前的配置文件中已有：

```env
R2_ACCOUNT_ID=bc19681f5c65cc1581d746eca6f0c4e6
R2_ACCESS_KEY_ID=bf54fa277551050cc96ddde78ccd9f77
R2_SECRET_ACCESS_KEY=1c1ee1277974d6e071ef3299f234613b5fa68051586360935592af1dcf0df028
```

### 3.2 如何获取新的 API Token（如果需要）

1. 在 Cloudflare Dashboard 中，进入 **"R2"** → **"Manage R2 API Tokens"**
2. 点击 **"Create API Token"**
3. 填写信息：
   ```
   Token Name: csv-visualizer-token
   Permissions: Admin Read & Write
   TTL: Forever (或根据需要设置)
   ```
4. 点击 **"Create API Token"**
5. **重要**：立即复制 Access Key ID 和 Secret Access Key（只显示一次！）

---

## 步骤 4：更新环境变量

### 4.1 本地开发环境

编辑 `/Users/mac/Desktop/ai-pm/csv-visualizer/.env.local`：

```env
# 保持不变
R2_ACCOUNT_ID=bc19681f5c65cc1581d746eca6f0c4e6
R2_ACCESS_KEY_ID=bf54fa277551050cc96ddde78ccd9f77
R2_SECRET_ACCESS_KEY=1c1ee1277974d6e071ef3299f234613b5fa68051586360935592af1dcf0df028

# 确认桶名称
R2_BUCKET_NAME=csv-visualizer-uploads

# 更新为您在步骤 2.3 中获取的公共 URL
R2_PUBLIC_URL=https://pub-您的实际域名.r2.dev
```

### 4.2 Vercel 生产环境

在 Vercel Dashboard 中配置环境变量：

1. 访问：https://vercel.com/everybodys-projects/csv-visualizer
2. 进入 **"Settings"** → **"Environment Variables"**
3. 添加以下变量（如果还没有）：
   ```
   R2_ACCOUNT_ID = bc19681f5c65cc1581d746eca6f0c4e6
   R2_ACCESS_KEY_ID = bf54fa277551050cc96ddde78ccd9f77
   R2_SECRET_ACCESS_KEY = 1c1ee1277974d6e071ef3299f234613b5fa68051586360935592af1dcf0df028
   R2_BUCKET_NAME = csv-visualizer-uploads
   R2_PUBLIC_URL = https://pub-您的实际域名.r2.dev
   ```
4. 确保所有变量都应用到 **Production** 环境

---

## 步骤 5：测试 R2 上传

### 5.1 本地测试

```bash
cd /Users/mac/Desktop/ai-pm/csv-visualizer
npm run dev

# 访问 http://localhost:3000
# 上传一个小的 CSV 文件（< 1MB）
# 检查浏览器控制台是否有错误
```

### 5.2 检查上传状态

在浏览器控制台中，成功上传会显示：

```
[R2] 文件已上传到云端: https://pub-xxxxx.r2.dev/1733812345678-export.csv
```

失败会显示：

```
[R2] 上传失败: Error: ...
```

### 5.3 验证文件

1. 访问您的 R2 桶：https://dash.cloudflare.com/ → R2 → csv-visualizer-uploads
2. 应该能看到上传的文件（文件名格式：`timestamp-filename.csv`）
3. 点击文件，可以看到公共 URL

---

## 步骤 6：重新部署 Vercel

配置好环境变量后，重新部署：

```bash
cd /Users/mac/Desktop/ai-pm/csv-visualizer
git add .
git commit -m "Update R2 public URL configuration"
git push origin main

# 或手动触发部署
npx vercel --prod
```

---

## 故障排查

### 问题 1：403 Forbidden

**原因**：桶没有启用公共访问

**解决**：
1. 进入 R2 桶设置
2. 启用 "Public Access" → "R2.dev subdomain"

### 问题 2：404 Not Found

**原因**：桶名称不匹配

**解决**：
1. 检查 `.env.local` 中的 `R2_BUCKET_NAME` 是否为 `csv-visualizer-uploads`
2. 检查 Cloudflare 中的桶名称是否一致

### 问题 3：401 Unauthorized

**原因**：API Token 无效或过期

**解决**：
1. 在 Cloudflare 中重新生成 API Token
2. 更新 `.env.local` 和 Vercel 环境变量

### 问题 4：413 Content Too Large

**原因**：文件超过 Vercel Serverless Function 限制（~4.5MB）

**解决**：
- 这是 Vercel 的限制，目前无法通过配置解决
- 对于大文件，IndexedDB 本地存储依然正常工作
- 未来可以实现分块上传或客户端直传

---

## 当前状态检查

运行以下命令检查配置：

```bash
# 检查环境变量
cat /Users/mac/Desktop/ai-pm/csv-visualizer/.env.local | grep R2

# 应该输出：
# R2_ACCOUNT_ID=bc19681f5c65cc1581d746eca6f0c4e6
# R2_ACCESS_KEY_ID=bf54fa277551050cc96ddde78ccd9f77
# R2_SECRET_ACCESS_KEY=1c1ee1277974d6e071ef3299f234613b5fa68051586360935592af1dcf0df028
# R2_BUCKET_NAME=csv-visualizer-uploads
# R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

---

## 快速配置检查清单

- [ ] Cloudflare 账号已登录
- [ ] R2 存储桶 `csv-visualizer-uploads` 已创建
- [ ] 桶已启用公共访问（R2.dev subdomain）
- [ ] 公共 URL 已复制（`https://pub-xxxxx.r2.dev`）
- [ ] `.env.local` 中 `R2_PUBLIC_URL` 已更新
- [ ] Vercel 环境变量已配置
- [ ] 本地测试上传成功
- [ ] Vercel 生产环境重新部署

---

## 下一步

完成配置后：

1. ✅ 本地测试上传小文件（< 1MB）
2. ✅ 检查 Cloudflare R2 桶中是否有文件
3. ✅ 推送代码到 GitHub 触发自动部署
4. ✅ 在生产环境测试上传功能

---

**配置完成后请告知，我可以帮您测试和验证！**
