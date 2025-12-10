# 🔧 解决 R2 上传 413 错误

## 问题分析

### 错误信息
```
POST https://csv-visualizer-one.vercel.app/api/upload-to-r2 413 (Content Too Large)
[R2] 上传失败: Error: R2 上传失败: 413
```

### 根本原因
- **Vercel Serverless Function 请求体限制**：Hobby 计划硬性限制为 **4.5MB**
- **无法通过配置修改**：这是 Vercel 平台限制，不是函数配置问题
- **影响**：> 4.5MB 的 CSV 文件无法上传到 R2

### 当前影响
- ✅ **不影响核心功能**：IndexedDB 本地存储正常工作
- ⚠️ **影响云端备份**：大文件无法同步到 R2

---

## 解决方案：配置优先 - Cloudflare R2 CORS + 客户端直传

### 方案概述

使用 **预签名 URL** 方式，让浏览器直接上传到 R2，绕过 Vercel：

```
旧流程（有 4.5MB 限制）:
浏览器 → Vercel API (4.5MB限制) → R2

新流程（无限制）:
浏览器 → Vercel API (请求签名URL, <1KB) → 获取签名URL
浏览器 → 直接上传到 R2 (无限制) ✓
```

---

## 配置步骤

### 步骤 1：在 Cloudflare R2 配置 CORS

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/
   - 进入 R2 → `csv-visualizer-uploads`

2. **配置 CORS 规则**
   - 点击 **Settings** 标签
   - 找到 **CORS Policy** 部分
   - 点击 **Edit CORS Policy**
   - 添加以下配置：

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
      "POST"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

3. **保存配置**

---

### 步骤 2：创建新的 API 路由（获取签名 URL）

我会创建一个新的 API 路由 `/api/get-upload-url`，用于生成预签名上传 URL。

**配置说明**：
- 这个 API 只返回签名 URL（<1KB），不涉及文件传输
- 签名 URL 有效期：15 分钟
- 浏览器直接使用签名 URL 上传到 R2

---

### 步骤 3：修改前端上传逻辑

修改 `uploadToR2` 函数，使用新的客户端直传流程：

1. 请求 Vercel API 获取签名 URL
2. 使用签名 URL 直接上传文件到 R2
3. 上传成功后获取公共 URL

---

## 优势对比

| 特性 | 旧方案（通过 Vercel） | 新方案（客户端直传） |
|------|---------------------|---------------------|
| **文件大小限制** | 4.5MB | 无限制 |
| **上传速度** | 慢（经过 Vercel） | 快（直连 R2） |
| **Vercel 带宽消耗** | 大 | 小（只请求签名） |
| **配置复杂度** | 低 | 中（需配置 CORS） |

---

## 实施建议

**请您确认是否要实施这个方案？**

如果确认，我会：
1. ✅ 帮您配置 Cloudflare R2 CORS（需要您提供 Dashboard 访问权限或手动配置）
2. ✅ 创建新的 API 路由 `/api/get-upload-url`
3. ✅ 修改前端上传逻辑
4. ✅ 测试大文件上传

---

## 临时方案（如果不想修改代码）

**当前状态已经可用**：
- ✅ IndexedDB 本地存储完全正常（无限制）
- ✅ 历史记录功能完全正常
- ✅ 小文件（< 4.5MB）可以备份到 R2
- ⚠️ 大文件（> 4.5MB）仅本地存储

**优点**：
- 无需修改代码
- 主要功能不受影响
- 开发和维护成本低

**缺点**：
- 大文件无法云端备份
- 无法跨设备同步大文件

---

**请告诉我您的选择：**
1. **实施客户端直传方案**（彻底解决问题，需要配置 CORS）
2. **保持当前状态**（接受 4.5MB 限制，主要功能可用）

我会根据您的选择继续操作。
