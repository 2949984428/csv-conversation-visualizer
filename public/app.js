// CSV对话数据可视化工具 - 前端应用
class CSVVisualizerApp {
    constructor() {
        this.currentFile = null;
        this.analysisResult = null;
        this.selectedTemplate = '';
        this.previewData = null;
        this.uploadHistory = [];

        this.initializeEventListeners();
        this.loadUploadHistory(); // 加载历史记录
    }

    initializeEventListeners() {
        // 文件上传相关
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // 模板选择
        document.addEventListener('click', this.handleTemplateClick.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        if (e.target.files.length > 0) {
            this.processFile(e.target.files[0]);
        }
    }

    handleTemplateClick(e) {
        const card = e.target.closest('.template-card');
        if (!card) return;
        
        const template = card.dataset.template;
        
        // 更新选中状态
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        this.selectedTemplate = template;
        
        // 显示/隐藏列选择器
        const columnSelector = document.getElementById('columnSelector');
        if (template === 'custom') {
            this.generateColumnSelector();
            columnSelector.style.display = 'block';
        } else {
            columnSelector.style.display = 'none';
        }
        
        this.updateButtons();
        
        // 自动生成预览和下载
        if (this.currentFile && this.selectedTemplate) {
            setTimeout(() => {
                this.autoGenerateAndDownload();
            }, 500);
        }
    }

    async processFile(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showStatus('请选择CSV格式文件', 'error');
            return;
        }

        if (file.size > 100 * 1024 * 1024) {
            this.showStatus('文件大小超过100MB限制', 'error');
            return;
        }

        this.currentFile = file;
        this.showStatus('正在分析文件...', 'info');
        this.showProgress(20);

        try {
            const formData = new FormData();
            formData.append('csvFile', file);

            const response = await fetch('/api/analyze-csv', {
                method: 'POST',
                body: formData
            });

            this.showProgress(60);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '分析失败');
            }

            const result = await response.json();
            this.analysisResult = result;

            this.showProgress(100);
            this.displayAnalysisResult(result);
            this.showStatus('文件分析完成', 'success');

            setTimeout(() => this.hideProgress(), 500);

        } catch (error) {
            console.error('文件分析失败:', error);
            this.showStatus(`分析失败: ${error.message}`, 'error');
            this.hideProgress();
        }
    }

    displayAnalysisResult(result) {
        // 显示文件信息
        const fileInfoDiv = document.getElementById('fileInfo');
        fileInfoDiv.innerHTML = `
            <div class="info-card">
                <div class="info-label">文件名</div>
                <div class="info-value">${result.filename}</div>
            </div>
            <div class="info-card">
                <div class="info-label">总行数</div>
                <div class="info-value">${result.totalRows.toLocaleString()}</div>
            </div>
            <div class="info-card">
                <div class="info-label">列数</div>
                <div class="info-value">${result.analysis.totalColumns} → ${result.analysis.filteredColumns}</div>
            </div>
            <div class="info-card">
                <div class="info-label">数据类型</div>
                <div class="info-value">${this.getDataTypeText(result.analysis)}</div>
            </div>
            <div class="info-card">
                <div class="info-label">媒体文件</div>
                <div class="info-value">${result.analysis.hasMediaUrls ? '✓ 包含' : '✗ 无'}</div>
            </div>
        `;

        // 推荐模板
        this.recommendTemplate(result.analysis);
        
        // 显示分析区域
        document.getElementById('analysisSection').style.display = 'block';
    }

    getDataTypeText(analysis) {
        if (analysis.hasSessionId && analysis.hasTurnNumber) {
            return '多轮对话';
        } else if (analysis.hasInput && analysis.hasOutput) {
            return '单轮对话';
        } else {
            return '自定义数据';
        }
    }

    recommendTemplate(analysis) {
        // 清除之前的选择
        document.querySelectorAll('.template-card').forEach(card => card.classList.remove('selected'));
        
        let recommendedTemplate = analysis.recommendedTemplate || 'custom';
        
        const recommendedCard = document.querySelector(`[data-template="${recommendedTemplate}"]`);
        if (recommendedCard) {
            recommendedCard.classList.add('selected');
            this.selectedTemplate = recommendedTemplate;
        }
        
        this.updateButtons();
    }

    generateColumnSelector() {
        if (!this.analysisResult) return;
        
        const columnGrid = document.getElementById('columnGrid');
        const headers = this.analysisResult.headers || [];
        
        columnGrid.innerHTML = headers.map(header => `
            <div class="column-item">
                <input type="checkbox" id="col_${header}" value="${header}" checked>
                <label for="col_${header}">${header}</label>
            </div>
        `).join('');
    }

    async generatePreview() {
        if (!this.currentFile || !this.selectedTemplate) {
            this.showStatus('请选择文件和模板', 'error');
            return;
        }

        this.showStatus('正在生成预览...', 'info');
        this.showProgress(30);

        try {
            const formData = new FormData();
            formData.append('csvFile', this.currentFile);
            formData.append('templateType', this.selectedTemplate);

            const response = await fetch('/api/preview', {
                method: 'POST',
                body: formData
            });

            this.showProgress(80);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '预览生成失败');
            }

            const result = await response.json();
            this.previewData = result;

            this.displayPreview(result.preview);
            this.showProgress(100);
            this.showStatus('预览生成完成', 'success');

            setTimeout(() => this.hideProgress(), 500);

        } catch (error) {
            console.error('预览生成失败:', error);
            this.showStatus(`预览失败: ${error.message}`, 'error');
            this.hideProgress();
        }
    }

    displayPreview(data) {
        const previewSection = document.getElementById('previewSection');
        const previewContent = document.getElementById('previewContent');
        
        let content = '<h5>数据预览 (前20条):</h5>';
        
        if (this.selectedTemplate === 'multi-turn') {
            content += data.map(session => `
                <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <strong>会话ID:</strong> ${session.sessionId}<br>
                    <strong>用户:</strong> ${session.userId || '未知'}<br>
                    <strong>轮次:</strong> ${session.turns ? session.turns.length : 0}
                </div>
            `).join('');
        } else {
            content += `
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">ID</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">时间</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">输入</th>
                            <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">输出</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.slice(0, 10).map(item => `
                            <tr>
                                <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${(item.id || '').substring(0, 12)}...</td>
                                <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${this.formatTime(item.timestamp)}</td>
                                <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${this.truncateText(item.input, 50)}</td>
                                <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${this.truncateText(item.output, 50)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        previewContent.innerHTML = content;
        previewSection.style.display = 'block';
    }

    async downloadHTML() {
        if (!this.currentFile || !this.selectedTemplate) {
            this.showStatus('请选择文件和模板', 'error');
            return;
        }

        this.showStatus('正在生成HTML文件...', 'info');
        this.showProgress(40);

        try {
            const formData = new FormData();
            formData.append('csvFile', this.currentFile);
            formData.append('templateType', this.selectedTemplate);

            // 如果是自定义模板，添加选中的列
            if (this.selectedTemplate === 'custom') {
                const selectedColumns = Array.from(document.querySelectorAll('#columnGrid input:checked'))
                    .map(input => input.value);
                formData.append('selectedColumns', JSON.stringify(selectedColumns));
            }

            const response = await fetch('/api/generate-html', {
                method: 'POST',
                body: formData
            });

            this.showProgress(90);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'HTML生成失败');
            }

            // 下载文件
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // 从响应头获取文件名，或生成默认文件名
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'visualization.html';
            if (contentDisposition) {
                const matches = /filename="([^"]*)"/.exec(contentDisposition);
                if (matches) filename = matches[1];
            }
            
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showProgress(100);
            this.showStatus('HTML文件下载完成！', 'success');

            setTimeout(() => this.hideProgress(), 500);

        } catch (error) {
            console.error('HTML生成失败:', error);
            this.showStatus(`生成失败: ${error.message}`, 'error');
            this.hideProgress();
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    truncateText(text, maxLength = 50) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    resetUpload() {
        this.currentFile = null;
        this.analysisResult = null;
        this.selectedTemplate = '';
        this.previewData = null;
        
        document.getElementById('analysisSection').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('fileInput').value = '';
        document.getElementById('statusMessage').style.display = 'none';
        
        this.hideProgress();
    }

    async autoGenerateAndDownload() {
        try {
            this.showStatus('自动生成中...', 'info');
            this.showProgress(10);

            // 先生成预览
            await this.generatePreview();

            this.showProgress(50);

            // 然后自动下载HTML文件
            await this.downloadHTMLAndOpen();

            this.showProgress(75);

            // 上传到 R2 并记录历史
            this.showStatus('正在保存到云端...', 'info');
            await this.uploadToR2(this.currentFile, this.selectedTemplate);

            this.showProgress(100);
            this.showStatus('✅ 已生成、下载并保存到云端！', 'success');

            setTimeout(() => this.hideProgress(), 1000);

        } catch (error) {
            console.error('自动生成失败:', error);
            this.showStatus(`自动生成失败: ${error.message}`, 'error');
            this.hideProgress();
        }
    }

    async downloadHTMLAndOpen() {
        if (!this.currentFile || !this.selectedTemplate) {
            throw new Error('请选择文件和模板');
        }

        const formData = new FormData();
        formData.append('csvFile', this.currentFile);
        formData.append('templateType', this.selectedTemplate);

        // 如果是自定义模板，添加选中的列
        if (this.selectedTemplate === 'custom') {
            const selectedColumns = Array.from(document.querySelectorAll('#columnGrid input:checked'))
                .map(input => input.value);
            formData.append('selectedColumns', JSON.stringify(selectedColumns));
        }

        const response = await fetch('/api/generate-html', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'HTML生成失败');
        }

        // 下载文件
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // 从响应头获取文件名，或生成默认文件名
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'visualization.html';
        if (contentDisposition) {
            const matches = /filename="([^"]*)"/.exec(contentDisposition);
            if (matches) filename = matches[1];
        }
        
        // 下载文件
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 自动在新标签页中打开文件
        setTimeout(() => {
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
                // 如果弹出窗口被阻止，显示提示
                this.showStatus('文件已下载，请手动打开或允许弹出窗口', 'info');
            }
            // 延迟释放URL，确保文件能正常打开
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 5000);
        }, 1000);
    }

    updateButtons() {
        const previewBtn = document.getElementById('previewBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        
        const hasFile = !!this.currentFile;
        const hasTemplate = !!this.selectedTemplate;
        
        previewBtn.disabled = !hasFile || !hasTemplate;
        downloadBtn.disabled = !hasFile || !hasTemplate;
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.textContent = message;
        statusDiv.className = `status-message status-${type}`;
        statusDiv.style.display = 'block';
    }

    showProgress(percent) {
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        
        progressBar.style.display = 'block';
        progressFill.style.width = percent + '%';
    }

    hideProgress() {
        document.getElementById('progressBar').style.display = 'none';
    }

    // ==================== 上传历史记录功能 ====================

    /**
     * 加载上传历史记录
     */
    async loadUploadHistory() {
        try {
            const response = await fetch('/api/upload-history');
            const data = await response.json();

            if (data.success) {
                this.uploadHistory = data.history || [];
                this.renderHistory();
            }
        } catch (error) {
            console.error('加载历史记录失败:', error);
        }
    }

    /**
     * 渲染历史记录列表
     */
    renderHistory() {
        const historyList = document.getElementById('historyList');

        if (this.uploadHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <div class="empty-history-icon">📂</div>
                    <p>暂无上传记录</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.uploadHistory.map(record => `
            <div class="history-item" data-id="${record.id}">
                <div class="history-item-name" title="${record.fileName}">
                    ${record.fileName}
                </div>
                <div class="history-item-meta">
                    <span class="history-item-time">
                        ${this.formatDate(record.uploadTime)}
                    </span>
                    <span class="history-item-size">
                        ${this.formatFileSize(record.fileSize)}
                    </span>
                </div>
                <div class="history-item-actions">
                    <button class="history-btn history-btn-download"
                            onclick="app.downloadFromR2('${record.r2Url}', '${record.fileName}')">
                        📥 下载
                    </button>
                    <button class="history-btn history-btn-delete"
                            onclick="app.deleteHistory('${record.id}')">
                        🗑️ 删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * 上传文件到 R2
     */
    async uploadToR2(file, templateType) {
        try {
            const formData = new FormData();
            formData.append('csvFile', file);
            formData.append('templateType', templateType);

            const response = await fetch('/api/upload-to-r2', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showStatus('✅ 文件已上传到云端并保存历史记录', 'success');
                await this.loadUploadHistory(); // 刷新历史列表
                return data.record;
            } else {
                throw new Error(data.error || '上传失败');
            }
        } catch (error) {
            console.error('上传到R2失败:', error);
            this.showStatus('上传到云端失败: ' + error.message, 'error');
            return null;
        }
    }

    /**
     * 从 R2 下载文件
     */
    async downloadFromR2(url, fileName) {
        try {
            this.showStatus('正在下载文件...', 'info');

            const response = await fetch(url);
            if (!response.ok) throw new Error('下载失败');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            this.showStatus('✅ 文件下载成功', 'success');
        } catch (error) {
            console.error('下载失败:', error);
            this.showStatus('下载失败: ' + error.message, 'error');
        }
    }

    /**
     * 删除历史记录
     */
    async deleteHistory(id) {
        if (!confirm('确定要删除这条记录吗？')) {
            return;
        }

        try {
            const response = await fetch(`/api/upload-history/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showStatus('✅ 记录已删除', 'success');
                await this.loadUploadHistory(); // 刷新历史列表
            } else {
                throw new Error(data.error || '删除失败');
            }
        } catch (error) {
            console.error('删除历史记录失败:', error);
            this.showStatus('删除失败: ' + error.message, 'error');
        }
    }

    /**
     * 格式化日期
     */
    formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;

        // 小于1分钟
        if (diff < 60000) {
            return '刚刚';
        }

        // 小于1小时
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)} 分钟前`;
        }

        // 小于1天
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)} 小时前`;
        }

        // 小于7天
        if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)} 天前`;
        }

        // 超过7天，显示具体日期
        return date.toLocaleDateString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
}

// 全局函数（为了兼容HTML中的onclick）
let app;

function generatePreview() {
    app.generatePreview();
}

function downloadHTML() {
    app.downloadHTML();
}

function resetUpload() {
    app.resetUpload();
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app = new CSVVisualizerApp();
});

// 服务器连接检查
async function checkServerConnection() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            console.log('✅ 服务器连接正常');
        }
    } catch (error) {
        console.warn('⚠️ 服务器连接失败:', error);
        app.showStatus('服务器连接失败，请检查服务是否启动', 'error');
    }
}

// 页面加载时检查服务器连接
setTimeout(checkServerConnection, 1000);