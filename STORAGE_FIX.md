# 🔧 LocalStorage 配额超限修复

## 问题描述

用户上传大型 CSV 文件时遇到错误：
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage': 
Setting the value of 'uploadHistory' exceeded the quota.
```

**原因**: localStorage 有 5-10MB 的存储限制，我们之前将完整的 CSV 解析数据（可能数MB）直接保存到 localStorage，导致超限。

---

## 解决方案：三层存储架构

### 架构设计

```
┌─────────────────────────────────────────┐
│         用户上传 CSV 文件                │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────▼──────────┐
        │  解析并组织数据     │
        └─────────┬──────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────────┐  ┌──────────▼─────────┐
│  IndexedDB     │  │  localStorage      │
│  (完整数据)     │  │  (元信息)          │
│  无限容量       │  │  < 1KB per record  │
│  - thread_id   │  │  - fileName        │
│  - 完整消息     │  │  - fileSize        │
│  - 图片URL      │  │  - uploadTime      │
│  - 时间戳       │  │  - threadCount     │
└────────────────┘  │  - r2Url           │
                    └────────────────────┘
                            │
                            │ (后台异步)
                    ┌───────▼──────────┐
                    │  Cloudflare R2   │
                    │  (云端备份)       │
                    │  永久存储         │
                    └──────────────────┘
```

### 层级详解

#### 1. IndexedDB（主数据存储）
- **用途**: 存储完整的 CSV 解析数据
- **容量**: 理论无限（通常可用空间的 50%）
- **数据结构**:
```javascript
{
  id: "1733812345678",
  data: {
    "thread-id-1": [ { timestamp, text, image_list, row_num }, ... ],
    "thread-id-2": [ ... ],
    ...
  }
}
```
- **优点**: 
  - 大容量存储
  - 异步操作不阻塞 UI
  - 结构化数据库

#### 2. localStorage（元信息索引）
- **用途**: 存储历史记录元信息（轻量级）
- **容量**: < 1KB per record
- **数据结构**:
```javascript
[
  {
    id: "1733812345678",
    fileName: "export-2025-12-08.csv",
    fileSize: 2456789,
    uploadTime: "2025-12-08T10:30:00.000Z",
    threadCount: 1444,
    r2Url: "https://r2.dev/file.csv" // 可选
  }
]
```
- **优点**:
  - 同步访问，速度快
  - 简单的 JSON 存储
  - 完美适配元信息场景

#### 3. Cloudflare R2（云端备份）
- **用途**: 长期云存储，跨设备访问
- **实现**: Vercel Serverless Function + R2 API
- **优点**:
  - 永久存储
  - 跨设备同步（未来功能）
  - 异步上传不阻塞用户

---

## 代码实现

### 1. IndexedDB 初始化

```javascript
async function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('CSVVisualizerDB', 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('csvData')) {
                db.createObjectStore('csvData', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
```

### 2. 保存数据流程

```javascript
async function addToHistory(file, data) {
    const id = Date.now().toString();

    // 步骤 1: 保存完整数据到 IndexedDB
    await saveToIndexedDB(id, data);

    // 步骤 2: 只保存元信息到 localStorage
    const record = {
        id, 
        fileName: file.name,
        fileSize: file.size,
        uploadTime: new Date().toISOString(),
        threadCount: Object.keys(data).length,
        r2Url: null
    };
    
    uploadHistory.unshift(record);
    localStorage.setItem('uploadHistory', JSON.stringify(uploadHistory));

    // 步骤 3: 后台上传到 R2（可选）
    try {
        const r2Result = await uploadToR2(file);
        // 更新 r2Url
        record.r2Url = r2Result.record.r2Url;
        localStorage.setItem('uploadHistory', JSON.stringify(uploadHistory));
    } catch (error) {
        console.warn('R2 上传失败（不影响本地使用）:', error);
    }
}
```

### 3. 加载数据流程

```javascript
async function loadHistoryFile(id) {
    const record = uploadHistory.find(r => r.id === id);
    
    // 从 IndexedDB 加载完整数据
    const data = await getFromIndexedDB(id);
    
    if (!data) {
        alert('数据已被清理，请重新上传文件');
        return;
    }

    // 恢复到全局状态
    globalThreads = data;
    renderSidebar();
    calculateAnalytics();
}
```

---

## 存储容量对比

| 存储方式 | 容量限制 | 数据类型 | 用途 |
|---------|---------|---------|------|
| **localStorage** | 5-10 MB | 元信息 (JSON) | 历史记录索引 |
| **IndexedDB** | ~可用空间的 50% | 完整数据 (Object) | 主数据存储 |
| **Cloudflare R2** | 无限 | 原始 CSV 文件 | 云端备份 |

**示例**:
- 10MB CSV 文件
- IndexedDB: 存储解析后的数据 (~10-15 MB)
- localStorage: 仅存储元信息 (~500 bytes)
- R2: 存储原始 CSV (~10 MB)

---

## 性能优化

### 1. 自动清理机制
- **限制**: 最多保留 50 条历史记录
- **实现**: 超出限制时自动清理最旧的记录
- **代码**:
```javascript
if (uploadHistory.length > 50) {
    uploadHistory = uploadHistory.slice(0, 50);
    cleanOldIndexedDBData(uploadHistory.map(r => r.id));
}
```

### 2. 异步操作
- 所有 IndexedDB 操作都是异步的，不阻塞 UI
- R2 上传在后台进行，失败不影响本地使用

### 3. 错误处理
- localStorage 超限时降级为仅保留 5 条记录
- IndexedDB 失败时提示用户但不中断流程
- R2 上传失败仅记录警告，不影响功能

---

## 测试验证

### 本地测试
1. 上传 10MB+ 的 CSV 文件
2. 检查浏览器 IndexedDB（DevTools → Application → IndexedDB）
3. 检查 localStorage 大小（应该 < 10KB）
4. 刷新页面，从历史记录加载文件
5. 验证数据完整性

### 浏览器兼容性
- ✅ Chrome 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge 12+
- ⚠️ 隐私模式下 IndexedDB 可能被禁用

---

## 部署状态

- ✅ 代码已提交到 GitHub
- ⏳ Vercel 自动部署进行中
- 🌐 线上地址: https://csv-visualizer-one.vercel.app

### 验证方法
```bash
# 检查是否部署了新代码
curl -s https://csv-visualizer-one.vercel.app | grep -o "IndexedDB"
# 应该返回多个 "IndexedDB" 匹配
```

---

## 后续优化建议

1. **压缩存储**: 使用 LZ-string 压缩 IndexedDB 数据
2. **增量同步**: 只同步变更的部分到 R2
3. **多设备同步**: 通过 R2 + localStorage 实现跨设备历史记录
4. **智能清理**: 基于 LRU 算法清理历史记录
5. **导出功能**: 一键导出所有历史记录为 ZIP

---

**修复时间**: 2025-12-10
**Git Commit**: a2c671d
**状态**: ✅ 已修复并推送
