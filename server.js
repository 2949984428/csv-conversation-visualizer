const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const CSVProcessor = require('./lib/csv-processor');
const TemplateGenerator = require('./lib/template-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static('public'));

// 文件上传配置
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB限制
});

// 路由定义

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// CSV文件上传和分析
app.post('/api/analyze-csv', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        const processor = new CSVProcessor();
        
        // 解析CSV
        const parseResult = await processor.parseCSV(csvContent);
        
        // 分析数据结构
        const analysis = processor.analyzeStructure(parseResult.data, parseResult.headers);
        
        res.json({
            success: true,
            filename: req.file.originalname,
            analysis: analysis,
            dataPreview: parseResult.data.slice(0, 5), // 前5行预览
            totalRows: parseResult.data.length,
            headers: parseResult.headers
        });

    } catch (error) {
        console.error('CSV分析错误:', error);
        res.status(500).json({ 
            error: '文件处理失败', 
            details: error.message 
        });
    }
});

// 生成可视化HTML
app.post('/api/generate-html', upload.single('csvFile'), async (req, res) => {
    try {
        const { templateType, selectedColumns } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        const processor = new CSVProcessor();
        const generator = new TemplateGenerator();
        
        // 解析和转换数据
        const parseResult = await processor.parseCSV(csvContent);
        const convertedData = processor.convertToStandardFormat(parseResult.data);
        
        // 生成HTML
        let htmlContent;
        const options = {
            filename: req.file.originalname,
            selectedColumns: selectedColumns ? JSON.parse(selectedColumns) : null
        };

        switch (templateType) {
            case 'single-turn':
                htmlContent = generator.generateSingleTurnTemplate(convertedData, options);
                break;
            case 'multi-turn':
                const sessionData = processor.groupBySession(convertedData);
                htmlContent = generator.generateMultiTurnTemplate(sessionData, options);
                break;
            case 'custom':
                htmlContent = generator.generateCustomTemplate(convertedData, options);
                break;
            default:
                return res.status(400).json({ error: '无效的模板类型' });
        }

        // 设置下载头
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `${req.file.originalname.replace('.csv', '')}_${templateType}_${timestamp}.html`;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(htmlContent);

    } catch (error) {
        console.error('HTML生成错误:', error);
        res.status(500).json({ 
            error: 'HTML生成失败', 
            details: error.message 
        });
    }
});

// 获取模板预览
app.post('/api/preview', upload.single('csvFile'), async (req, res) => {
    try {
        const { templateType } = req.body;
        
        const csvContent = req.file.buffer.toString('utf-8');
        const processor = new CSVProcessor();
        const parseResult = await processor.parseCSV(csvContent);
        const convertedData = processor.convertToStandardFormat(parseResult.data.slice(0, 20)); // 只预览前20条
        
        res.json({
            success: true,
            preview: convertedData,
            totalRows: parseResult.data.length
        });

    } catch (error) {
        console.error('预览生成错误:', error);
        res.status(500).json({ 
            error: '预览生成失败', 
            details: error.message 
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({ 
        error: '服务器内部错误',
        details: error.message 
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 CSV可视化工具服务器已启动`);
    console.log(`📱 访问地址: http://localhost:${PORT}`);
    console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app;