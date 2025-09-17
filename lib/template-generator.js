const fs = require('fs');
const path = require('path');

class TemplateGenerator {
    constructor() {
        this.templatesPath = path.join(__dirname, '..', 'templates');
    }

    /**
     * 生成单轮对话HTML模板
     * @param {Array} data - 转换后的数据
     * @param {Object} options - 选项
     * @returns {string} HTML内容
     */
    generateSingleTurnTemplate(data, options = {}) {
        const { filename = 'data.csv' } = options;
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI对话任务 - ${filename}</title>
    <style>${this.getSingleTurnCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="controls">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="搜索对话内容...">
            </div>
            <div class="stats">
                <div class="stat-item">对话: <strong id="total-items">${data.length}</strong></div>
                <div class="stat-item">媒体: <strong id="media-count">0</strong></div>
                <div class="stat-item">显示: <strong id="current-showing">${data.length}</strong></div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 8%;">ID</th>
                            <th style="width: 8%;">时间</th>
                            <th style="width: 20%;">用户输入</th>
                            <th style="width: 12%;">输入媒体</th>
                            <th style="width: 35%;">AI处理步骤</th>
                            <th style="width: 15%;">生成结果</th>
                            <th style="width: 12%;">输出媒体</th>
                        </tr>
                    </thead>
                    <tbody id="dataTableBody">
                        <!-- 数据将通过JavaScript动态加载 -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="pagination">
            <button id="prevBtn" onclick="changePage(-1)">上一页</button>
            <span id="pageInfo">第 1 页</span>
            <button id="nextBtn" onclick="changePage(1)">下一页</button>
            <select id="pageSize" onchange="changePageSize()">
                <option value="10">10条/页</option>
                <option value="20" selected>20条/页</option>
                <option value="50">50条/页</option>
            </select>
            <button class="download-btn" style="background: #dc2626;" onclick="downloadAllMedia()">批量下载所有媒体</button>
        </div>
    </div>

    <!-- 媒体预览模态框 -->
    <div id="mediaModal" class="modal">
        <div class="modal-content">
            <span class="modal-close" onclick="closeModal()">&times;</span>
            <div id="modalMediaContainer"></div>
            <div class="modal-info">
                <div id="modalInfo"></div>
                <button class="download-btn" onclick="downloadCurrentMedia()">下载此文件</button>
                <button class="download-btn" onclick="openInNewTab()">新标签页打开</button>
            </div>
        </div>
    </div>

    <!-- AI步骤详情模态框 -->
    <div id="stepsOverlay" class="ai-steps-overlay" onclick="closeStepsModal()"></div>
    <div id="stepsModal" class="ai-steps-detail">
        <button class="steps-modal-close" onclick="closeStepsModal()">&times;</button>
        <div id="stepsContent"></div>
    </div>

    <script>
        // 数据
        const realData = ${JSON.stringify(data, null, 2)};
        
        // JavaScript代码
        ${this.getSingleTurnJS()}
    </script>
</body>
</html>`;
    }

    /**
     * 生成多轮对话HTML模板
     * @param {Array} sessions - 会话数据
     * @param {Object} options - 选项
     * @returns {string} HTML内容
     */
    generateMultiTurnTemplate(sessions, options = {}) {
        const { filename = 'data.csv' } = options;
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI多轮对话任务 - ${filename}</title>
    <style>${this.getMultiTurnCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="controls">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="搜索会话内容、用户ID...">
            </div>
            <div class="stats">
                <div class="stat-item">会话: <strong id="total-sessions">${sessions.length}</strong></div>
                <div class="stat-item">轮次: <strong id="total-turns">0</strong></div>
                <div class="stat-item">媒体: <strong id="media-count">0</strong></div>
                <div class="stat-item">显示: <strong id="current-showing">${sessions.length}</strong></div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="conversations-list" id="conversationsList">
                <!-- 对话会话将在这里动态生成 -->
            </div>
        </div>
        
        <div class="pagination">
            <button id="prevBtn" onclick="changePage(-1)">上一页</button>
            <span id="pageInfo">第 1 页</span>
            <button id="nextBtn" onclick="changePage(1)">下一页</button>
            <select id="pageSize" onchange="changePageSize()">
                <option value="10">10会话/页</option>
                <option value="20" selected>20会话/页</option>
                <option value="50">50会话/页</option>
            </select>
            <button class="download-btn" style="background: #dc2626;" onclick="downloadAllMedia()">批量下载所有媒体</button>
        </div>
    </div>

    <!-- 媒体预览模态框 -->
    <div id="mediaModal" class="modal">
        <div class="modal-content">
            <span class="modal-close" onclick="closeModal()">&times;</span>
            <div id="modalMediaContainer"></div>
            <div class="modal-info">
                <div id="modalInfo"></div>
                <button class="download-btn" onclick="downloadCurrentMedia()">下载此文件</button>
                <button class="download-btn" onclick="openInNewTab()">新标签页打开</button>
            </div>
        </div>
    </div>

    <script>
        // 会话数据
        const sampleConversations = ${JSON.stringify(sessions, null, 2)};
        
        // JavaScript代码
        ${this.getMultiTurnJS()}
    </script>
</body>
</html>`;
    }

    /**
     * 生成自定义模板
     * @param {Array} data - 数据
     * @param {Object} options - 选项
     * @returns {string} HTML内容
     */
    generateCustomTemplate(data, options = {}) {
        const { filename = 'data.csv', selectedColumns = null } = options;
        const columns = selectedColumns || Object.keys(data[0] || {});
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>自定义数据展示 - ${filename}</title>
    <style>${this.getCustomCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="controls">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="搜索数据内容...">
            </div>
            <div class="stats">
                <div class="stat-item">总数: <strong id="total-items">${data.length}</strong></div>
                <div class="stat-item">显示: <strong id="current-showing">${data.length}</strong></div>
                <div class="stat-item">字段: <strong id="column-count">${columns.length}</strong></div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="table-container">
                <table>
                    <thead id="tableHeader">
                        <tr>
                            ${columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody id="dataTableBody">
                        <!-- 数据将通过JavaScript动态加载 -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="pagination">
            <button id="prevBtn" onclick="changePage(-1)">上一页</button>
            <span id="pageInfo">第 1 页</span>
            <button id="nextBtn" onclick="changePage(1)">下一页</button>
            <select id="pageSize" onchange="changePageSize()">
                <option value="10">10条/页</option>
                <option value="20" selected>20条/页</option>
                <option value="50">50条/页</option>
            </select>
        </div>
    </div>

    <script>
        // 数据
        const customData = ${JSON.stringify(data, null, 2)};
        const displayColumns = ${JSON.stringify(columns, null, 2)};
        
        // JavaScript代码
        ${this.getCustomJS()}
    </script>
</body>
</html>`;
    }

    /**
     * 获取单轮对话CSS样式
     */
    getSingleTurnCSS() {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
        }
        
        .controls {
            padding: 1.5rem;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .search-box {
            flex: 1;
            min-width: 300px;
        }
        
        .search-box input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 1rem;
            transition: all 0.2s;
        }
        
        .search-box input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .stats {
            display: flex;
            gap: 1rem;
            font-size: 0.875rem;
            color: #64748b;
        }
        
        .stat-item {
            background: white;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            border: 1px solid #e2e8f0;
        }
        
        .main-content {
            padding: 0;
        }
        
        .table-container {
            overflow-x: auto;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }
        
        th, td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        
        th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        tr:hover {
            background: #f9fafb;
        }
        
        .media-gallery {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .media-item {
            position: relative;
            width: 60px;
            height: 60px;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s;
            background: #f9fafb;
        }
        
        .media-item:hover {
            border-color: #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .media-item img,
        .media-item video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .media-type-badge {
            position: absolute;
            top: 2px;
            left: 2px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-size: 0.6rem;
        }
        
        .document-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        }
        
        .doc-icon {
            font-size: 1.5rem;
            margin-bottom: 0.25rem;
        }
        
        .doc-name {
            font-size: 0.6rem;
            color: #6b7280;
            text-align: center;
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
        }
        
        .modal-content {
            position: relative;
            margin: auto;
            padding: 2rem;
            max-width: 95%;
            max-height: 95%;
            top: 50%;
            transform: translateY(-50%);
            text-align: center;
        }
        
        .modal img, .modal video {
            max-width: 100%;
            max-height: 85vh;
            object-fit: contain;
            border-radius: 0.5rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .modal-close {
            position: absolute;
            top: 1rem;
            right: 2rem;
            color: white;
            font-size: 2rem;
            font-weight: bold;
            cursor: pointer;
            z-index: 1001;
        }
        
        .modal-info {
            color: white;
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 0.5rem;
            font-size: 0.875rem;
        }
        
        .download-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            cursor: pointer;
            margin-top: 0.5rem;
            margin-right: 0.5rem;
            transition: background 0.2s;
        }
        
        .download-btn:hover {
            background: #2563eb;
        }
        
        .pagination {
            padding: 1.5rem;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
        }
        
        .pagination button {
            padding: 0.5rem 1rem;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 0.375rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .pagination button:hover {
            background: #f3f4f6;
        }
        
        .pagination button:disabled {
            background: #f9fafb;
            color: #9ca3af;
            cursor: not-allowed;
        }
        
        /* AI步骤展示样式 */
        .ai-steps-container {
            min-width: 200px;
            max-width: 350px;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            text-align: left;
            align-items: flex-start;
        }
        
        .step-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            overflow: hidden;
            transition: all 0.2s;
            width: 100%;
            text-align: left;
        }
        
        .step-box:hover {
            border-color: #3b82f6;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }
        
        .step-header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 0.5rem 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .step-number {
            background: rgba(255, 255, 255, 0.2);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
        }
        
        .step-tool {
            font-size: 0.75rem;
            opacity: 0.9;
        }
        
        .step-content {
            padding: 0.75rem;
            line-height: 1.4;
            color: #374151;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-size: 0.8rem;
        }
        
        .no-steps {
            padding: 1rem;
            text-align: center;
            color: #6b7280;
            font-style: italic;
            background: #f9fafb;
            border: 1px dashed #d1d5db;
            border-radius: 0.5rem;
            font-size: 0.8rem;
        }
        
        /* 表格中的AI步骤单元格样式 */
        td.ai-steps-container {
            text-align: left !important;
            vertical-align: top;
            padding: 0.75rem !important;
        }
        
        .ai-steps-detail {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 95vw;
            max-height: 95vh;
            overflow-y: auto;
            z-index: 1000;
            padding: 2rem;
        }
        
        .ai-steps-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        }
        
        .ai-step-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .ai-step-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .ai-step-number {
            background: #3b82f6;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .ai-step-tool {
            background: #059669;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
        }
        
        .ai-step-content {
            color: #374151;
            line-height: 1.6;
            font-size: 0.875rem;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-width: none;
        }
        
        .steps-modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 50%;
            width: 2rem;
            height: 2rem;
            cursor: pointer;
            font-size: 1.25rem;
            line-height: 1;
        }
        
        /* 结构化输出样式 */
        .structured-output {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            margin: 0.75rem 0;
            overflow: hidden;
        }
        
        .output-header {
            background: #3b82f6;
            color: white;
            padding: 0.5rem 0.75rem;
            font-weight: 600;
            font-size: 0.875rem;
        }
        
        .output-content {
            padding: 0.75rem;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        .output-content p {
            margin: 0.25rem 0;
        }
        
        .output-content ul, .output-content ol {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
        }
        
        .output-content li {
            margin: 0.25rem 0;
        }
        
        .output-content a {
            color: #3b82f6;
            text-decoration: underline;
        }
        
        .ai-step-summary {
            background: #f1f5f9;
            padding: 0.75rem;
            border-radius: 0.375rem;
            margin: 0.5rem 0;
            font-weight: 500;
            color: #334155;
        }
        
        .ai-step-details {
            margin-top: 0.75rem;
        }
        
        .ai-step-details summary {
            cursor: pointer;
            font-size: 0.875rem;
            color: #64748b;
            padding: 0.5rem;
            background: #f8fafc;
            border-radius: 0.25rem;
            border: 1px solid #e2e8f0;
        }
        
        .ai-step-details summary:hover {
            background: #f1f5f9;
        }
        
        .ai-step-raw-content {
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-radius: 0.25rem;
            padding: 0.75rem;
            margin-top: 0.5rem;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.75rem;
            line-height: 1.4;
            color: #374151;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }`;
    }

    /**
     * 获取单轮对话JavaScript代码
     */
    getSingleTurnJS() {
        return `
        let currentData = [...realData];
        let filteredData = [...realData];
        let currentPage = 1;
        let pageSize = 20;
        let currentMediaUrl = '';
        let currentMediaType = '';
        
        function formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        function truncateText(text, maxLength = 120) {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        }
        
        function truncateId(id, maxLength = 12) {
            if (!id) return '';
            const parts = id.split(':');
            const mainId = parts[0];
            return mainId.length > maxLength ? '...' + mainId.substring(mainId.length - maxLength) : mainId;
        }
        
        function createMediaGallery(mediaList) {
            if (!mediaList || mediaList.length === 0) return '';
            
            const mediaElements = mediaList.map((media, index) => {
                const mediaId = \`media_\${Date.now()}_\${index}\`;
                const isVideo = media.type === 'video';
                const isDocument = media.type === 'document';
                
                let mediaTitle = '文件';
                let badge = '📄 文档';
                
                if (isVideo) {
                    mediaTitle = '视频';
                    badge = '📹 MP4';
                } else if (isDocument) {
                    mediaTitle = '文档';
                    badge = '📄 PDF';
                } else {
                    mediaTitle = '图片';
                    badge = '🖼️ 图片';
                }
                
                return \`
                    <div class="media-item" onclick="showMedia('\${media.url}', '\${media.type}', '\${mediaTitle} \${index + 1}')">
                        \${isVideo ? 
                            \`<video id="\${mediaId}" muted preload="metadata">
                                <source src="\${media.url}" type="video/mp4">
                            </video>\` :
                            isDocument ?
                            \`<div class="document-placeholder">
                                <div class="doc-icon">📄</div>
                                <div class="doc-name">文档 \${index + 1}</div>
                            </div>\` :
                            \`<img id="\${mediaId}" src="\${media.url}" alt="图片 \${index + 1}" loading="lazy">\`
                        }
                        <div class="media-type-badge">\${badge}</div>
                    </div>
                \`;
            }).join('');
            
            return \`<div class="media-gallery">\${mediaElements}</div>\`;
        }
        
        function extractFinalResult(output, aiSteps) {
            if (!output) return '无结果';
            
            // 如果有AI步骤信息，尝试提取最终生成的结果
            if (aiSteps && aiSteps.hasSteps) {
                // 查找图片生成步骤
                const imageGenStep = aiSteps.steps.find(step => 
                    step.tool === 'Navo_image_generate' || step.tool === 'image_generate'
                );
                
                if (imageGenStep && imageGenStep.content) {
                    // 从内容中提取图片标题
                    const titleMatch = imageGenStep.content.match(/\\[([^\\]]+)\\]/);
                    if (titleMatch) {
                        return \`🎨 生成图片: \${titleMatch[1]}\`;
                    }
                }
                
                // 查找任务完成状态
                const completeStep = aiSteps.steps.find(step => step.tool === 'terminate');
                if (completeStep) {
                    return '✅ 任务完成';
                }
                
                // 如果有多个步骤，显示整体状态
                return \`完成了\${aiSteps.steps.length}个处理步骤\`;
            }
            
            // 尝试从原始输出中提取关键信息
            if (output.includes('has generated') || output.includes('生成') || output.includes('Image has been generated')) {
                // 提取生成的图片信息 - 支持多种格式
                let imageMatch = output.match(/\\[([^\\]]+)\\]: (https:\\/\\/[^\\s]+)/);
                if (!imageMatch) {
                    // 尝试匹配 "Image has been generated by XXX: URL" 格式
                    imageMatch = output.match(/Image has been generated by ([^:]+): (https:\\/\\/[^\\s,]+)/);
                    if (imageMatch) {
                        return \`🎨 生成图片: \${imageMatch[1]}\`;
                    }
                }
                if (imageMatch) {
                    return \`🎨 生成: \${imageMatch[1]}\`;
                }
            }
            
            if (output.includes('success') || output.includes('completed')) {
                return '✅ 任务完成';
            }
            
            // 默认截断显示
            return truncateText(output, 100);
        }
        
        function createAIStepsDisplay(aiSteps, itemId) {
            if (!aiSteps || !aiSteps.hasSteps) {
                return \`<div class="ai-steps-container"><div class="no-steps">无步骤信息</div></div>\`;
            }
            
            // 生成独立的步骤框
            const stepBoxes = aiSteps.steps.map((step, index) => {
                const stepNum = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index] || (index + 1);
                const toolName = step.tool ? step.tool : '未知工具';
                const toolIcon = getToolIcon(step.tool);
                
                return \`
                    <div class="step-box">
                        <div class="step-header">
                            <span class="step-number">步骤\${stepNum}</span>
                            <span class="step-tool">\${toolIcon} \${toolName}</span>
                        </div>
                        <div class="step-content">
                            \${step.content}
                        </div>
                    </div>
                \`;
            }).join('');
            
            return \`
                <div class="ai-steps-container">
                    \${stepBoxes}
                </div>
            \`;
        }
        
        function getToolIcon(toolName) {
            const iconMap = {
                'handoff': '🔄',
                'make_plan': '📝',
                'lora_recommendation': '🎨',
                'seed_image_generate': '🖼️',
                'flux_kontext_max': '⚡',
                'Navo_image_generate': '🎭',
                'image_analyzer': '🔍',
                'poster_design_guidance': '📋',
                'task_domain_guidance': '📋',
                'terminate': '✅'
            };
            return iconMap[toolName] || '🔧';
        }
        
        function renderTable() {
            const tbody = document.getElementById('dataTableBody');
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageData = filteredData.slice(startIndex, endIndex);
            
            if (pageData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 3rem; color: #9ca3af;">没有找到匹配的数据</td></tr>';
                return;
            }
            
            tbody.innerHTML = pageData.map(item => \`
                <tr>
                    <td class="id-cell">\${truncateId(item.id)}</td>
                    <td class="time-cell">\${formatTime(item.timestamp)}</td>
                    <td class="text-cell">\${truncateText(item.input)}</td>
                    <td class="media-cell">\${createMediaGallery(item.inputMedia)}</td>
                    <td class="ai-steps-container">\${createAIStepsDisplay(item.aiSteps, item.id)}</td>
                    <td class="text-cell">\${extractFinalResult(item.output, item.aiSteps)}</td>
                    <td class="media-cell">\${createMediaGallery(item.outputMedia)}</td>
                </tr>
            \`).join('');
            
            updateStats();
        }
        
        function updateStats() {
            const totalMedia = filteredData.reduce((total, item) => {
                return total + (item.inputMedia ? item.inputMedia.length : 0) + (item.outputMedia ? item.outputMedia.length : 0);
            }, 0);
            
            document.getElementById('total-items').textContent = currentData.length;
            document.getElementById('media-count').textContent = totalMedia;
            document.getElementById('current-showing').textContent = filteredData.length;
        }
        
        function showMedia(url, type, title) {
            currentMediaUrl = url;
            currentMediaType = type;
            
            const modal = document.getElementById('mediaModal');
            const container = document.getElementById('modalMediaContainer');
            const info = document.getElementById('modalInfo');
            
            if (type === 'video') {
                container.innerHTML = \`<video controls autoplay muted><source src="\${url}" type="video/mp4"></video>\`;
            } else {
                container.innerHTML = \`<img src="\${url}" alt="\${title}">\`;
            }
            
            info.textContent = \`\${title} - \${type === 'video' ? 'MP4视频' : '图片'}\`;
            modal.style.display = 'block';
        }
        
        function closeModal() {
            document.getElementById('mediaModal').style.display = 'none';
        }
        
        function downloadCurrentMedia() {
            if (currentMediaUrl) {
                const a = document.createElement('a');
                a.href = currentMediaUrl;
                a.target = '_blank';
                a.click();
            }
        }
        
        function openInNewTab() {
            if (currentMediaUrl) {
                window.open(currentMediaUrl, '_blank');
            }
        }
        
        function downloadAllMedia() {
            let allMediaUrls = [];
            filteredData.forEach(item => {
                if (item.inputMedia) allMediaUrls = allMediaUrls.concat(item.inputMedia);
                if (item.outputMedia) allMediaUrls = allMediaUrls.concat(item.outputMedia);
            });
            
            if (allMediaUrls.length === 0) {
                alert('没有可下载的媒体文件');
                return;
            }
            
            allMediaUrls.forEach((media, index) => {
                setTimeout(() => {
                    const a = document.createElement('a');
                    a.href = media.url;
                    a.target = '_blank';
                    a.click();
                }, index * 1000);
            });
        }
        
        function search() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            if (!query) {
                filteredData = [...currentData];
            } else {
                filteredData = currentData.filter(item => 
                    (item.input && item.input.toLowerCase().includes(query)) ||
                    (item.output && item.output.toLowerCase().includes(query)) ||
                    (item.id && item.id.toLowerCase().includes(query))
                );
            }
            
            currentPage = 1;
            renderTable();
            updatePagination();
        }
        
        function changePage(direction) {
            const totalPages = Math.ceil(filteredData.length / pageSize);
            const newPage = currentPage + direction;
            
            if (newPage >= 1 && newPage <= totalPages) {
                currentPage = newPage;
                renderTable();
                updatePagination();
            }
        }
        
        function changePageSize() {
            pageSize = parseInt(document.getElementById('pageSize').value);
            currentPage = 1;
            renderTable();
            updatePagination();
        }
        
        function updatePagination() {
            const totalPages = Math.ceil(filteredData.length / pageSize);
            
            document.getElementById('prevBtn').disabled = currentPage <= 1;
            document.getElementById('nextBtn').disabled = currentPage >= totalPages;
            document.getElementById('pageInfo').textContent = \`第 \${currentPage} 页 (共 \${totalPages} 页)\`;
        }
        
        function showStepsModal(itemId) {
            const item = filteredData.find(data => data.id === itemId);
            if (!item || !item.aiSteps || !item.aiSteps.hasSteps) return;
            
            const stepsContent = document.getElementById('stepsContent');
            const modal = document.getElementById('stepsModal');
            const overlay = document.getElementById('stepsOverlay');
            
            // 生成步骤详情HTML
            const stepsHtml = item.aiSteps.steps.map(step => \`
                <div class="ai-step-item">
                    <div class="ai-step-header">
                        <span class="ai-step-number">步骤 \${step.stepNumber}</span>
                        \${step.tool ? \`<span class="ai-step-tool">\${step.tool}</span>\` : ''}
                    </div>
                    <div class="ai-step-content">\${step.fullContent}</div>
                    \${step.structuredOutput ? generateStructuredOutput(step.structuredOutput) : ''}
                </div>
            \`).join('');
            
            stepsContent.innerHTML = \`
                <h3 style="margin-bottom: 1rem; color: #374151;">AI处理步骤 - 共\${item.aiSteps.steps.length}个步骤</h3>
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; font-size: 0.875rem; color: #64748b;">
                    记录ID: \${item.id.substring(0, 20)}...
                </div>
                \${stepsHtml}
            \`;
            
            modal.style.display = 'block';
            overlay.style.display = 'block';
        }
        
        function generateStructuredOutput(output) {
            if (!output) return '';
            
            switch (output.type) {
                case 'image_analysis':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">📊 分析结果</div>
                            <div class="output-content">
                                <p><strong>图片尺寸:</strong> \${output.dimensions}</p>
                                <p><strong>内容描述:</strong> \${output.description}</p>
                                \${output.imageUrl ? \`<p><strong>图片链接:</strong> <a href="\${output.imageUrl}" target="_blank">查看原图</a></p>\` : ''}
                            </div>
                        </div>
                    \`;
                case 'image_generation':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">🎨 生成结果</div>
                            <div class="output-content">
                                <p><strong>图片标题:</strong> \${output.title}</p>
                                <p><strong>生成链接:</strong> <a href="\${output.imageUrl}" target="_blank">查看生成的图片</a></p>
                                <img src="\${output.imageUrl}" alt="\${output.title}" style="max-width: 200px; border-radius: 4px; margin-top: 0.5rem;">
                            </div>
                        </div>
                    \`;
                case 'design_guidance':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">📋 设计要点</div>
                            <div class="output-content">
                                <ul>
                                    \${output.points.map(point => \`<li>\${point}</li>\`).join('')}
                                </ul>
                                \${output.hasPrompt ? '<p style="color: #059669; font-weight: 500;">✓ 包含AI生成提示</p>' : ''}
                            </div>
                        </div>
                    \`;
                case 'task_handoff':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">🔄 任务交接</div>
                            <div class="output-content">
                                <p>\${output.context}</p>
                            </div>
                        </div>
                    \`;
                case 'planning':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">📝 计划步骤</div>
                            <div class="output-content">
                                <ol>
                                    \${output.steps.map(step => \`<li>\${step}</li>\`).join('')}
                                </ol>
                            </div>
                        </div>
                    \`;
                case 'completion':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">✅ 任务状态</div>
                            <div class="output-content">
                                <p style="color: #059669; font-weight: 500;">状态: \${output.status}</p>
                            </div>
                        </div>
                    \`;
                default:
                    return '';
            }
        }
        
        function closeStepsModal() {
            document.getElementById('stepsModal').style.display = 'none';
            document.getElementById('stepsOverlay').style.display = 'none';
        }
        
        // 事件监听
        document.getElementById('searchInput').addEventListener('input', search);
        
        // 模态框点击外部关闭
        document.getElementById('mediaModal').addEventListener('click', (e) => {
            if (e.target.id === 'mediaModal') {
                closeModal();
            }
        });
        
        // 初始化
        renderTable();
        updatePagination();`;
    }

    /**
     * 获取多轮对话CSS样式
     */
    getMultiTurnCSS() {
        // 返回多轮对话样式，与单轮类似但有所调整
        return this.getSingleTurnCSS() + `
        .conversations-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
        }
        
        .conversation-thread {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .conversation-header {
            background: #f8fafc;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            cursor: pointer;
            transition: background-color 0.2s;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .conversation-header:hover {
            background: #f1f5f9;
        }
        
        .session-id {
            font-weight: 600;
            font-size: 1.1rem;
            color: #059669;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            transition: all 0.2s;
            word-break: break-all;
        }
        
        .session-id:hover {
            background: #e0f2fe;
            color: #0369a1;
        }
        
        .session-id:active {
            background: #bae6fd;
        }
        
        .conversation-turns {
            display: none;
        }
        
        .conversation-turns.expanded {
            display: block;
        }
        
        .turn-item {
            padding: 1.5rem;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .turn-content {
            display: grid;
            gap: 1rem;
            grid-template-columns: 1fr 1fr;
        }
        
        .input-section, .output-section {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 0.5rem;
        }
        
        .input-section {
            border-left: 4px solid #3b82f6;
        }
        
        .output-section {
            border-left: 4px solid #059669;
        }
        
        /* 多轮对话表格样式 */
        .turn-table {
            margin-top: 1rem;
        }
        
        .multi-turn-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
            background: white;
            border-radius: 0.5rem;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        
        .multi-turn-table th {
            background: #f8fafc;
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .multi-turn-table td {
            padding: 0.75rem;
            vertical-align: top;
            border-right: 1px solid #f1f5f9;
        }
        
        .multi-turn-table td:last-child {
            border-right: none;
        }
        
        .multi-turn-table .text-cell {
            line-height: 1.5;
            max-height: 120px;
            overflow-y: auto;
        }
        
        .multi-turn-table .media-cell {
            min-width: 80px;
        }
        
        .multi-turn-table .ai-steps-container {
            min-width: 120px;
        }`;
    }

    /**
     * 获取多轮对话JavaScript代码
     */
    getMultiTurnJS() {
        return `
        let allSessions = [...sampleConversations];
        let filteredSessions = [...sampleConversations];
        let currentPage = 1;
        let pageSize = 20;
        let currentMediaUrl = '';
        let currentMediaType = '';
        
        function formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        function truncateText(text, maxLength = 120) {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        }
        
        function extractFinalResult(output, aiSteps) {
            if (!output) return '无结果';
            
            // 如果有AI步骤信息，尝试提取最终生成的结果
            if (aiSteps && aiSteps.hasSteps) {
                // 查找图片生成步骤
                const imageGenStep = aiSteps.steps.find(step => 
                    step.tool === 'Navo_image_generate' || step.tool === 'image_generate'
                );
                
                if (imageGenStep && imageGenStep.content) {
                    // 从内容中提取图片标题
                    const titleMatch = imageGenStep.content.match(/\\[([^\\]]+)\\]/);
                    if (titleMatch) {
                        return \`🎨 生成图片: \${titleMatch[1]}\`;
                    }
                }
                
                // 查找任务完成状态
                const completeStep = aiSteps.steps.find(step => step.tool === 'terminate');
                if (completeStep) {
                    return '✅ 任务完成';
                }
                
                // 如果有多个步骤，显示整体状态
                return \`完成了\${aiSteps.steps.length}个处理步骤\`;
            }
            
            // 尝试从原始输出中提取关键信息
            if (output.includes('has generated') || output.includes('生成') || output.includes('Image has been generated')) {
                // 提取生成的图片信息 - 支持多种格式
                let imageMatch = output.match(/\\[([^\\]]+)\\]: (https:\\/\\/[^\\s]+)/);
                if (!imageMatch) {
                    // 尝试匹配 "Image has been generated by XXX: URL" 格式
                    imageMatch = output.match(/Image has been generated by ([^:]+): (https:\\/\\/[^\\s,]+)/);
                    if (imageMatch) {
                        return \`🎨 生成图片: \${imageMatch[1]}\`;
                    }
                }
                if (imageMatch) {
                    return \`🎨 生成: \${imageMatch[1]}\`;
                }
            }
            
            if (output.includes('success') || output.includes('completed')) {
                return '✅ 任务完成';
            }
            
            // 默认截断显示
            return truncateText(output, 100);
        }
        
        function createMediaGallery(mediaList) {
            if (!mediaList || mediaList.length === 0) return '';
            
            const mediaElements = mediaList.map((media, index) => {
                const isVideo = media.type === 'video';
                return \`
                    <div class="media-item" onclick="showMedia('\${media.url}', '\${media.type}', '\${isVideo ? '视频' : '图片'} \${index + 1}')">
                        \${isVideo ? 
                            \`<video muted preload="metadata"><source src="\${media.url}" type="video/mp4"></video>\` :
                            \`<img src="\${media.url}" alt="图片 \${index + 1}" loading="lazy">\`
                        }
                        <div class="media-type-badge">\${isVideo ? '📹 MP4' : '🖼️ 图片'}</div>
                    </div>
                \`;
            }).join('');
            
            return \`<div class="media-gallery">\${mediaElements}</div>\`;
        }
        
        function renderConversations() {
            const container = document.getElementById('conversationsList');
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageData = filteredSessions.slice(startIndex, endIndex);
            
            if (pageData.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 3rem; color: #9ca3af;">没有找到匹配的会话</div>';
                return;
            }
            
            container.innerHTML = pageData.map(session => {
                const turnsHtml = session.turns.map((turn, index) => \`
                    <div class="turn-item">
                        <div class="turn-header">
                            <div class="turn-number">第 \${index + 1} 轮</div>
                            <div class="turn-time">\${formatTime(turn.timestamp)}</div>
                        </div>
                        <div class="turn-table">
                            <table class="multi-turn-table">
                                <thead>
                                    <tr>
                                        <th style="width: 20%;">用户输入</th>
                                        <th style="width: 15%;">输入媒体</th>
                                        <th style="width: 35%;">AI处理步骤</th>
                                        <th style="width: 15%;">生成结果</th>
                                        <th style="width: 15%;">输出媒体</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="text-cell">\${turn.input || '无'}</td>
                                        <td class="media-cell">\${createMediaGallery(turn.inputMedia)}</td>
                                        <td class="ai-steps-container">\${createAIStepsDisplay(turn.aiSteps, turn.id || session.sessionId + '_' + index)}</td>
                                        <td class="text-cell">\${extractFinalResult(turn.output, turn.aiSteps) || '无'}</td>
                                        <td class="media-cell">\${createMediaGallery(turn.outputMedia)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                \`).join('');
                
                return \`
                    <div class="conversation-thread">
                        <div class="conversation-header" onclick="toggleConversation('\${session.sessionId}')">
                            <div class="conversation-info">
                                <div class="session-id" onclick="copySessionId('\${session.sessionId}', event)" title="点击复制会话ID">会话ID: \${session.sessionId}</div>
                                <div class="conversation-meta">
                                    <span>用户: \${session.userId || '未知'}</span>
                                    <span>轮次: \${session.turns.length}</span>
                                    <span>时间: \${formatTime(session.turns[session.turns.length - 1].timestamp)}</span>
                                </div>
                            </div>
                            <div class="expand-icon">▼</div>
                        </div>
                        <div class="conversation-turns" id="turns-\${session.sessionId}">
                            \${turnsHtml}
                        </div>
                    </div>
                \`;
            }).join('');
            
            updateStats();
        }
        
        function toggleConversation(sessionId) {
            const turns = document.getElementById(\`turns-\${sessionId}\`);
            turns.classList.toggle('expanded');
        }
        
        function copySessionId(sessionId, event) {
            // 阻止事件冒泡，避免触发toggleConversation
            event.stopPropagation();
            
            // 复制到剪贴板
            navigator.clipboard.writeText(sessionId).then(() => {
                // 显示复制成功提示
                const element = event.target;
                const originalText = element.textContent;
                element.textContent = '已复制!';
                element.style.background = '#dcfce7';
                element.style.color = '#166534';
                
                setTimeout(() => {
                    element.textContent = originalText;
                    element.style.background = '';
                    element.style.color = '';
                }, 1000);
            }).catch(err => {
                console.error('复制失败:', err);
                // 降级方案：选中文本
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(event.target);
                selection.removeAllRanges();
                selection.addRange(range);
            });
        }
        
        function updateStats() {
            const totalTurns = filteredSessions.reduce((total, session) => total + session.turns.length, 0);
            const totalMedia = filteredSessions.reduce((total, session) => {
                return total + session.turns.reduce((turnTotal, turn) => {
                    return turnTotal + (turn.inputMedia ? turn.inputMedia.length : 0) + (turn.outputMedia ? turn.outputMedia.length : 0);
                }, 0);
            }, 0);
            
            document.getElementById('total-sessions').textContent = allSessions.length;
            document.getElementById('total-turns').textContent = totalTurns;
            document.getElementById('media-count').textContent = totalMedia;
            document.getElementById('current-showing').textContent = filteredSessions.length;
        }
        
        function showMedia(url, type, title) {
            currentMediaUrl = url;
            currentMediaType = type;
            
            const modal = document.getElementById('mediaModal');
            const container = document.getElementById('modalMediaContainer');
            const info = document.getElementById('modalInfo');
            
            if (type === 'video') {
                container.innerHTML = \`<video controls autoplay muted><source src="\${url}" type="video/mp4"></video>\`;
            } else {
                container.innerHTML = \`<img src="\${url}" alt="\${title}">\`;
            }
            
            info.textContent = \`\${title} - \${type === 'video' ? 'MP4视频' : '图片'}\`;
            modal.style.display = 'block';
        }
        
        function closeModal() {
            document.getElementById('mediaModal').style.display = 'none';
        }
        
        function downloadCurrentMedia() {
            if (currentMediaUrl) {
                const a = document.createElement('a');
                a.href = currentMediaUrl;
                a.target = '_blank';
                a.click();
            }
        }
        
        function openInNewTab() {
            if (currentMediaUrl) {
                window.open(currentMediaUrl, '_blank');
            }
        }
        
        function downloadAllMedia() {
            let allMediaUrls = [];
            filteredSessions.forEach(session => {
                session.turns.forEach(turn => {
                    if (turn.inputMedia) allMediaUrls = allMediaUrls.concat(turn.inputMedia);
                    if (turn.outputMedia) allMediaUrls = allMediaUrls.concat(turn.outputMedia);
                });
            });
            
            if (allMediaUrls.length === 0) {
                alert('没有可下载的媒体文件');
                return;
            }
            
            allMediaUrls.forEach((media, index) => {
                setTimeout(() => {
                    const a = document.createElement('a');
                    a.href = media.url;
                    a.target = '_blank';
                    a.click();
                }, index * 1000);
            });
        }
        
        function search() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            if (!query) {
                filteredSessions = [...allSessions];
            } else {
                filteredSessions = allSessions.filter(session => {
                    const sessionMatch = session.sessionId.toLowerCase().includes(query) || 
                                       (session.userId && session.userId.toLowerCase().includes(query));
                    
                    const turnsMatch = session.turns.some(turn => 
                        (turn.input && turn.input.toLowerCase().includes(query)) ||
                        (turn.output && turn.output.toLowerCase().includes(query))
                    );
                    
                    return sessionMatch || turnsMatch;
                });
            }
            
            currentPage = 1;
            renderConversations();
            updatePagination();
        }
        
        function changePage(direction) {
            const totalPages = Math.ceil(filteredSessions.length / pageSize);
            const newPage = currentPage + direction;
            
            if (newPage >= 1 && newPage <= totalPages) {
                currentPage = newPage;
                renderConversations();
                updatePagination();
            }
        }
        
        function changePageSize() {
            pageSize = parseInt(document.getElementById('pageSize').value);
            currentPage = 1;
            renderConversations();
            updatePagination();
        }
        
        function updatePagination() {
            const totalPages = Math.ceil(filteredSessions.length / pageSize);
            
            document.getElementById('prevBtn').disabled = currentPage <= 1;
            document.getElementById('nextBtn').disabled = currentPage >= totalPages;
            document.getElementById('pageInfo').textContent = \`第 \${currentPage} 页 (共 \${totalPages} 页)\`;
        }
        
        function showStepsModal(itemId) {
            // 在多轮对话中查找对应的步骤数据
            let targetSteps = null;
            let targetId = itemId;
            
            for (const session of filteredSessions) {
                for (let i = 0; i < session.turns.length; i++) {
                    const turn = session.turns[i];
                    const turnId = turn.id || session.sessionId + '_' + i;
                    if (turnId === itemId && turn.aiSteps && turn.aiSteps.hasSteps) {
                        targetSteps = turn.aiSteps;
                        break;
                    }
                }
                if (targetSteps) break;
            }
            
            if (!targetSteps) return;
            
            const stepsContent = document.getElementById('stepsContent');
            const modal = document.getElementById('stepsModal');
            const overlay = document.getElementById('stepsOverlay');
            
            // 生成步骤详情HTML
            const stepsHtml = targetSteps.steps.map(step => \`
                <div class="ai-step-item">
                    <div class="ai-step-header">
                        <span class="ai-step-number">步骤 \${step.stepNumber}</span>
                        \${step.tool ? \`<span class="ai-step-tool">\${step.tool}</span>\` : ''}
                    </div>
                    <div class="ai-step-content">\${step.fullContent}</div>
                    \${step.structuredOutput ? generateStructuredOutput(step.structuredOutput) : ''}
                </div>
            \`).join('');
            
            stepsContent.innerHTML = \`
                <h3 style="margin-bottom: 1rem; color: #374151;">AI处理步骤 - 共\${targetSteps.steps.length}个步骤</h3>
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; font-size: 0.875rem; color: #64748b;">
                    轮次ID: \${targetId.substring(0, 20)}...
                </div>
                \${stepsHtml}
            \`;
            
            modal.style.display = 'block';
            overlay.style.display = 'block';
        }
        
        function closeStepsModal() {
            document.getElementById('stepsModal').style.display = 'none';
            document.getElementById('stepsOverlay').style.display = 'none';
        }
        
        function generateStructuredOutput(output) {
            if (!output) return '';
            
            switch (output.type) {
                case 'image_analysis':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">📊 分析结果</div>
                            <div class="output-content">
                                <p><strong>图片尺寸:</strong> \${output.dimensions}</p>
                                <p><strong>内容描述:</strong> \${output.description}</p>
                                \${output.imageUrl ? \`<p><strong>图片链接:</strong> <a href="\${output.imageUrl}" target="_blank">查看原图</a></p>\` : ''}
                            </div>
                        </div>
                    \`;
                case 'image_generation':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">🎨 生成结果</div>
                            <div class="output-content">
                                <p><strong>图片标题:</strong> \${output.title}</p>
                                <p><strong>生成链接:</strong> <a href="\${output.imageUrl}" target="_blank">查看生成的图片</a></p>
                                <img src="\${output.imageUrl}" alt="\${output.title}" style="max-width: 200px; border-radius: 4px; margin-top: 0.5rem;">
                            </div>
                        </div>
                    \`;
                case 'design_guidance':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">📋 设计要点</div>
                            <div class="output-content">
                                <ul>
                                    \${output.points.map(point => \`<li>\${point}</li>\`).join('')}
                                </ul>
                                \${output.hasPrompt ? '<p style="color: #059669; font-weight: 500;">✓ 包含AI生成提示</p>' : ''}
                            </div>
                        </div>
                    \`;
                case 'task_handoff':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">🔄 任务交接</div>
                            <div class="output-content">
                                <p>\${output.context}</p>
                            </div>
                        </div>
                    \`;
                case 'planning':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">📝 计划步骤</div>
                            <div class="output-content">
                                <ol>
                                    \${output.steps.map(step => \`<li>\${step}</li>\`).join('')}
                                </ol>
                            </div>
                        </div>
                    \`;
                case 'completion':
                    return \`
                        <div class="structured-output">
                            <div class="output-header">✅ 任务状态</div>
                            <div class="output-content">
                                <p style="color: #059669; font-weight: 500;">状态: \${output.status}</p>
                            </div>
                        </div>
                    \`;
                default:
                    return '';
            }
        }
        
        function createAIStepsDisplay(aiSteps, itemId) {
            if (!aiSteps || !aiSteps.hasSteps) {
                return \`<div class="ai-steps-container"><div class="no-steps">无步骤信息</div></div>\`;
            }
            
            // 生成独立的步骤框
            const stepBoxes = aiSteps.steps.map((step, index) => {
                const stepNum = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index] || (index + 1);
                const toolName = step.tool ? step.tool : '未知工具';
                const toolIcon = getToolIcon(step.tool);
                
                return \`
                    <div class="step-box">
                        <div class="step-header">
                            <span class="step-number">步骤\${stepNum}</span>
                            <span class="step-tool">\${toolIcon} \${toolName}</span>
                        </div>
                        <div class="step-content">
                            \${step.content}
                        </div>
                    </div>
                \`;
            }).join('');
            
            return \`
                <div class="ai-steps-container">
                    \${stepBoxes}
                </div>
            \`;
        }
        
        function getToolIcon(toolName) {
            const iconMap = {
                'handoff': '🔄',
                'make_plan': '📝',
                'lora_recommendation': '🎨',
                'seed_image_generate': '🖼️',
                'flux_kontext_max': '⚡',
                'Navo_image_generate': '🎭',
                'image_analyzer': '🔍',
                'poster_design_guidance': '📋',
                'task_domain_guidance': '📋',
                'terminate': '✅'
            };
            return iconMap[toolName] || '🔧';
        }
        
        // 事件监听
        document.getElementById('searchInput').addEventListener('input', search);
        document.getElementById('mediaModal').addEventListener('click', (e) => {
            if (e.target.id === 'mediaModal') {
                closeModal();
            }
        });
        
        // 初始化
        renderConversations();
        updatePagination();`;
    }

    /**
     * 获取自定义模板CSS样式
     */
    getCustomCSS() {
        return this.getSingleTurnCSS().replace('#3b82f6', '#667eea').replace('#8b5cf6', '#764ba2');
    }

    /**
     * 获取自定义模板JavaScript代码
     */
    getCustomJS() {
        return `
        let currentData = [...customData];
        let filteredData = [...customData];
        let currentPage = 1;
        let pageSize = 20;
        
        function truncateText(text, maxLength = 100) {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        }
        
        function renderTable() {
            const tbody = document.getElementById('dataTableBody');
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageData = filteredData.slice(startIndex, endIndex);
            
            if (pageData.length === 0) {
                tbody.innerHTML = \`<tr><td colspan="\${displayColumns.length}" style="text-align: center; padding: 3rem; color: #9ca3af;">没有找到匹配的数据</td></tr>\`;
                return;
            }
            
            tbody.innerHTML = pageData.map(item => \`
                <tr>
                    \${displayColumns.map(col => \`<td>\${truncateText(String(item[col] || ''))}</td>\`).join('')}
                </tr>
            \`).join('');
            
            updateStats();
        }
        
        function updateStats() {
            document.getElementById('total-items').textContent = currentData.length;
            document.getElementById('current-showing').textContent = filteredData.length;
            document.getElementById('column-count').textContent = displayColumns.length;
        }
        
        function search() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            if (!query) {
                filteredData = [...currentData];
            } else {
                filteredData = currentData.filter(item => {
                    return displayColumns.some(col => {
                        const value = item[col];
                        return value && String(value).toLowerCase().includes(query);
                    });
                });
            }
            
            currentPage = 1;
            renderTable();
            updatePagination();
        }
        
        function changePage(direction) {
            const totalPages = Math.ceil(filteredData.length / pageSize);
            const newPage = currentPage + direction;
            
            if (newPage >= 1 && newPage <= totalPages) {
                currentPage = newPage;
                renderTable();
                updatePagination();
            }
        }
        
        function changePageSize() {
            pageSize = parseInt(document.getElementById('pageSize').value);
            currentPage = 1;
            renderTable();
            updatePagination();
        }
        
        function updatePagination() {
            const totalPages = Math.ceil(filteredData.length / pageSize);
            
            document.getElementById('prevBtn').disabled = currentPage <= 1;
            document.getElementById('nextBtn').disabled = currentPage >= totalPages;
            document.getElementById('pageInfo').textContent = \`第 \${currentPage} 页 (共 \${totalPages} 页)\`;
        }
        
        // 事件监听
        document.getElementById('searchInput').addEventListener('input', search);
        
        // 初始化
        renderTable();
        updatePagination();`;
    }
}

module.exports = TemplateGenerator;