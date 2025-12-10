# Vercel 部署指南

## 部署步骤

### 1. 登录 Vercel
访问 https://vercel.com 并登录您的账号

### 2. 导入 GitHub 仓库
1. 点击 "Add New..." → "Project"
2. 从 GitHub 列表中选择 `csv-conversation-visualizer`
3. 点击 "Import"

### 3. 配置环境变量（重要！）

在 "Environment Variables" 部分添加以下变量：

```
R2_ACCOUNT_ID = bc19681f5c65cc1581d746eca6f0c4e6
R2_ACCESS_KEY_ID = bf54fa277551050cc96ddde78ccd9f77
R2_SECRET_ACCESS_KEY = 1c1ee1277974d6e071ef3299f234613b5fa68051586360935592af1dcf0df028
R2_BUCKET_NAME = csv-visualizer-uploads
R2_PUBLIC_URL = https://pub-3816599c0a1d44a2b6fbcffcbb9509b9.r2.dev
```

⚠️ **注意**：将所有环境变量应用到 Production, Preview, 和 Development 环境

### 4. 部署设置

Vercel 会自动检测配置：
- **Framework Preset**: Other
- **Build Command**: (留空)
- **Output Directory**: public
- **Install Command**: npm install

### 5. 点击 "Deploy"

等待 1-2 分钟，部署完成后访问：
https://csv-visualizer-one.vercel.app

## 功能说明

### 上传历史功能
- **主存储**: 浏览器 localStorage（即时可用，离线可用）
- **云备份**: Cloudflare R2（后台异步上传，失败不影响使用）
- **位置**: 左侧栏底部 "上传历史" 导航项

### 云存储工作原理
1. 用户上传 CSV 文件
2. 文件立即保存到 localStorage（主存储）
3. 同时异步上传到 R2（云备份，失败不阻塞）
4. 历史记录可以：
   - 加载：从 localStorage 恢复数据到查看器
   - 下载：重新下载 CSV 文件
   - 删除：从 localStorage 移除记录

### API 路由（Vercel Serverless Functions）
- `/api/upload-to-r2` - 上传文件到 Cloudflare R2
- `/api/upload-history` - 历史记录管理（暂时使用 localStorage）

## 验证部署

部署成功后，测试以下功能：

1. ✅ 上传 CSV 文件
2. ✅ 查看对话数据
3. ✅ AI 场景分析（如果可用）
4. ✅ 点击 "上传历史" 查看历史记录
5. ✅ 从历史记录加载文件
6. ✅ 下载历史文件
7. ✅ 删除历史记录

## 故障排查

### R2 上传失败
- 检查 Vercel 环境变量是否正确配置
- 查看浏览器控制台是否有错误
- 检查 Cloudflare R2 桶设置是否允许公共访问

### 历史记录不显示
- 检查浏览器 localStorage 是否被禁用
- 尝试清除浏览器缓存
- 检查浏览器控制台错误

### API 路由 404
- 确认 `vercel.json` 配置正确
- 重新部署项目
- 检查 Vercel 部署日志

## 更新部署

推送新代码到 GitHub 后，Vercel 会自动重新部署：

```bash
git add -A
git commit -m "update: description"
git push origin main
```

---

🚀 **生成时间**: 2025-01-XX  
📦 **仓库**: https://github.com/2949984428/csv-conversation-visualizer
🌐 **线上地址**: https://csv-visualizer-one.vercel.app
