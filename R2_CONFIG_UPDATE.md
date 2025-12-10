# ✅ R2 配置已更新

## 本地环境

已更新 `.env.local` 文件：

```env
R2_PUBLIC_URL="https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev"
```

开发服务器已重启，新配置已生效。

---

## Vercel 生产环境配置

**重要**：需要在 Vercel Dashboard 中更新环境变量

### 方法 1：通过 Vercel Dashboard（推荐）

1. 访问：https://vercel.com/everybodys-projects/csv-visualizer/settings/environment-variables

2. 找到 `R2_PUBLIC_URL` 变量

3. 点击右侧的编辑按钮（铅笔图标）

4. 更新值为：
   ```
   https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev
   ```

5. 确保应用到 **Production** 环境

6. 点击 **Save**

7. 重新部署项目（会自动触发）

### 方法 2：通过 Vercel CLI

```bash
cd /Users/mac/Desktop/ai-pm/csv-visualizer

# 更新环境变量
vercel env add R2_PUBLIC_URL production

# 粘贴值：https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev

# 重新部署
vercel --prod
```

---

## 测试步骤

### 本地测试（已可用）

1. 访问：http://localhost:3000
2. 上传一个小的 CSV 文件（< 1MB）
3. 打开浏览器控制台（F12）
4. 查看是否有成功消息：
   ```
   [R2] 文件已上传到云端: https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev/...
   ```

### 验证 R2 存储

1. 访问 Cloudflare Dashboard：https://dash.cloudflare.com/
2. 进入 R2 → csv-visualizer-uploads
3. 应该能看到上传的文件

### 生产环境测试（配置 Vercel 后）

1. 访问：https://csv-visualizer-one.vercel.app
2. 重复上传测试
3. 检查 R2 桶中是否有新文件

---

## 当前状态

- ✅ Cloudflare R2 桶已创建：`csv-visualizer-uploads`
- ✅ 公共访问已启用：`https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev`
- ✅ 本地 `.env.local` 已更新
- ⏳ 待办：更新 Vercel 环境变量

---

## 下一步

**请您完成以下操作：**

1. 访问 Vercel Dashboard 更新 `R2_PUBLIC_URL` 环境变量
2. 或者告诉我，我可以通过 CLI 帮您更新
3. 更新后重新部署（会自动触发）

**配置完成后，R2 云端备份功能将正常工作！**
