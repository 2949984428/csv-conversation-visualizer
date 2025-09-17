const fs = require('fs');

class CSVProcessor {
    constructor() {
        this.excludedFields = ['latency', 'level', 'observationcount'];
    }

    /**
     * 解析CSV文件内容
     * @param {string} csvContent - CSV文件内容
     * @returns {Object} { headers, data }
     */
    async parseCSV(csvContent) {
        try {
            const lines = csvContent.trim().split('\n');
            if (lines.length < 2) {
                throw new Error('CSV文件格式不正确，至少需要标题行和一行数据');
            }

            // 解析标题行
            const headers = this.parseCSVLine(lines[0]);
            
            // 解析数据行
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    try {
                        const row = this.parseCSVLine(line);
                        if (row.length === headers.length) {
                            const rowObj = {};
                            headers.forEach((header, index) => {
                                rowObj[header] = row[index] || '';
                            });
                            data.push(rowObj);
                        }
                    } catch (error) {
                        console.warn(`跳过第${i+1}行，解析错误:`, error.message);
                    }
                }
            }

            return { headers, data };
        } catch (error) {
            throw new Error(`CSV解析失败: ${error.message}`);
        }
    }

    /**
     * 解析CSV行，正确处理引号和逗号
     * @param {string} line - CSV行内容
     * @returns {Array} 解析后的字段数组
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i += 2;
                    continue;
                }
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
                i++;
                continue;
            } else {
                current += char;
            }
            i++;
        }

        result.push(current.trim());
        return result.map(field => field.replace(/^"(.*)"$/, '$1')); // 移除外层引号
    }

    /**
     * 分析数据结构
     * @param {Array} data - 解析后的数据
     * @param {Array} headers - 表头
     * @returns {Object} 分析结果
     */
    analyzeStructure(data, headers) {
        // 过滤不需要的字段
        const filteredHeaders = headers.filter(h => 
            !this.excludedFields.some(excluded => 
                h.toLowerCase().includes(excluded.toLowerCase())
            )
        );

        const analysis = {
            totalRows: data.length,
            totalColumns: headers.length,
            filteredColumns: filteredHeaders.length,
            excludedColumns: headers.length - filteredHeaders.length,
            hasSessionId: headers.some(h => h.toLowerCase().includes('session')),
            hasTurnNumber: headers.some(h => h.toLowerCase().includes('turn')),
            hasTimestamp: headers.some(h => h.toLowerCase().includes('time')),
            hasInput: headers.some(h => h.toLowerCase().includes('input')),
            hasOutput: headers.some(h => h.toLowerCase().includes('output')),
            hasMediaUrls: false,
            dataTypes: {},
            sampleData: data.slice(0, 3)
        };

        // 检查媒体URL
        analysis.hasMediaUrls = this.detectMediaUrls(data.slice(0, 10));

        // 分析数据类型
        filteredHeaders.forEach(header => {
            analysis.dataTypes[header] = this.detectDataType(data, header);
        });

        // 推荐模板
        analysis.recommendedTemplate = this.recommendTemplate(analysis);

        return analysis;
    }

    /**
     * 检测媒体URL
     * @param {Array} sampleData - 样本数据
     * @returns {boolean} 是否包含媒体URL
     */
    detectMediaUrls(sampleData) {
        for (const row of sampleData) {
            // 检查input字段中的图片
            if (row.input) {
                try {
                    const inputData = JSON.parse(row.input);
                    if (inputData.user_input) {
                        const userInputArray = JSON.parse(inputData.user_input);
                        if (userInputArray.some(item => item.type === 'image' && item.image_url)) {
                            return true;
                        }
                    }
                } catch (e) {
                    // 如果解析失败，检查原始字符串
                    if (this.containsMediaUrl(row.input)) {
                        return true;
                    }
                }
            }

            // 检查output字段中生成的图片
            if (row.output && row.output.includes('liblibai-online.liblib.cloud/agent_images/')) {
                return true;
            }

            // 检查其他字段
            for (const key in row) {
                if (this.containsMediaUrl(row[key])) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 检查字符串是否包含媒体URL
     * @param {string} str - 要检查的字符串
     * @returns {boolean}
     */
    containsMediaUrl(str) {
        if (!str) return false;
        return str.includes('http') && 
               (str.includes('.jpg') || str.includes('.png') || 
                str.includes('.mp4') || str.includes('.gif') || 
                str.includes('.jpeg'));
    }

    /**
     * 检测数据类型
     * @param {Array} data - 数据数组
     * @param {string} column - 列名
     * @returns {string} 数据类型
     */
    detectDataType(data, column) {
        const samples = data.slice(0, 10).map(row => row[column]).filter(val => val && val.trim());
        
        if (samples.length === 0) return 'empty';
        
        // 检查是否为时间戳
        if (column.toLowerCase().includes('time') && samples.every(s => /\d{4}-\d{2}-\d{2}/.test(s))) {
            return 'timestamp';
        }
        
        // 检查是否为JSON
        if (samples.some(s => s.startsWith('{') && s.endsWith('}'))) {
            return 'json';
        }
        
        // 检查是否为数字
        if (samples.every(s => !isNaN(parseFloat(s)))) {
            return 'number';
        }
        
        // 检查是否为URL
        if (samples.some(s => s.includes('http'))) {
            return 'url';
        }
        
        return 'text';
    }

    /**
     * 推荐模板类型
     * @param {Object} analysis - 分析结果
     * @returns {string} 推荐的模板类型
     */
    recommendTemplate(analysis) {
        if (analysis.hasSessionId && analysis.hasTurnNumber) {
            return 'multi-turn';
        } else if (analysis.hasInput && analysis.hasOutput) {
            return 'single-turn';
        } else {
            return 'custom';
        }
    }

    /**
     * 解析AI输出中的步骤信息
     * @param {string} outputText - AI输出文本
     * @returns {Object} { steps: Array, summary: string, hasSteps: boolean }
     */
    parseAISteps(outputText) {
        if (!outputText) return { steps: [], summary: '', hasSteps: false };

        const steps = [];
        
        // 更精确的步骤匹配正则，处理多行内容
        const stepRegex = /步骤\s*(\d+):\s*([\s\S]*?)(?=步骤\s*\d+:|$)/g;
        let match;
        
        while ((match = stepRegex.exec(outputText)) !== null) {
            const stepNumber = parseInt(match[1]);
            const stepContent = match[2].trim();
            
            // 解析工具调用信息
            const toolMatch = stepContent.match(/Observation of Tool `([^`]+)`, output is:\s*([\s\S]*?)(?=\n\n|$|步骤)/);
            
            let tool = null;
            let toolOutput = null;
            let cleanContent = stepContent;
            let structuredOutput = null;
            
            if (toolMatch) {
                tool = toolMatch[1];
                toolOutput = toolMatch[2].trim();
                
                // 保留完整原始内容，将\n转换为实际换行，清理多余空行
                const processContent = (content) => {
                    return content.replace(/\\n/g, '\n')
                                 .replace(/\n\s*\n\s*\n/g, '\n\n')  // 最多保留一个空行
                                 .trim(); // 去除首尾空白
                };

                if (tool === 'image_analyzer') {
                    // 保留分析内容，只去除多余格式
                    cleanContent = `🔍 [${tool}] ${processContent(toolOutput.replace(/Image analysis result:\s*/, ''))}`;
                } else if (tool === 'Navo_image_generate' || tool === 'image_generate') {
                    // 保留图片生成的详细信息
                    cleanContent = `🎨 [${tool}] ${processContent(toolOutput)}`;
                } else if (tool === 'poster_design_guidance' || tool === 'task_domain_guidance') {
                    // 保留设计指导的完整内容
                    cleanContent = `📋 [${tool}] ${processContent(toolOutput)}`;
                } else if (tool === 'handoff') {
                    // 保留任务交接的详细信息
                    cleanContent = `🔄 [${tool}] ${processContent(toolOutput)}`;
                } else if (tool === 'make_plan') {
                    // 保留计划制定的完整内容
                    cleanContent = `📝 [${tool}] ${processContent(toolOutput)}`;
                } else if (tool === 'terminate') {
                    // 保留终止状态的详细信息
                    cleanContent = `✅ [${tool}] ${processContent(toolOutput)}`;
                } else {
                    // 其他工具保留完整输出
                    cleanContent = `🔧 [${tool}] ${processContent(toolOutput)}`;
                }
            } else {
                // 没有工具调用，保持完整的原始内容并处理换行符
                cleanContent = stepContent.replace(/\\n/g, '\n').replace(/\n\s*\n/g, '\n');
            }
            
            steps.push({
                stepNumber: stepNumber,
                content: cleanContent,
                tool: tool,
                toolOutput: toolOutput,
                structuredOutput: structuredOutput,
                fullContent: stepContent,
                rawContent: stepContent
            });
        }

        // 如果没有找到标准步骤格式，尝试其他格式
        if (steps.length === 0) {
            // 检查是否有工具调用但没有步骤编号
            const toolCallPattern = /(\w+)\s*has\s+(generated|done|completed)/i;
            // 检查是否有"步骤X:"格式但不是标准格式
            const stepPattern = /步骤[一二三四五六七八九十\d]+[:：]/;
            
            if (toolCallPattern.test(outputText) || stepPattern.test(outputText)) {
                const processedContent = outputText.replace(/\\n/g, '\n').replace(/\n\s*\n/g, '\n');
                steps.push({
                    stepNumber: 1,
                    content: processedContent,
                    tool: 'unknown',
                    toolOutput: outputText,
                    structuredOutput: null,
                    fullContent: outputText,
                    rawContent: outputText
                });
            }
        }

        return {
            steps: steps,
            summary: steps.length > 0 ? `${steps.length}个步骤` : outputText.substring(0, 50) + '...',
            hasSteps: steps.length > 0,
            rawOutput: outputText
        };
    }

    /**
     * 提取设计要点
     */
    extractDesignPoints(text) {
        const points = [];
        const sections = text.split(/\d+\.\s+/).filter(s => s.trim());
        sections.forEach(section => {
            const firstLine = section.split('\n')[0].trim();
            if (firstLine && firstLine.length > 0) {
                points.push(firstLine);
            }
        });
        return points.slice(0, 6); // 最多显示6个要点
    }

    /**
     * 提取计划步骤
     */
    extractPlanSteps(text) {
        const steps = [];
        const stepMatches = text.match(/Step \d+[^:]*:\s*([^\n]+)/g);
        if (stepMatches) {
            stepMatches.forEach(match => {
                const content = match.replace(/Step \d+[^:]*:\s*/, '').trim();
                steps.push(content);
            });
        }
        return steps.slice(0, 5); // 最多显示5个步骤
    }

    /**
     * 转换数据为标准格式
     * @param {Array} rawData - 原始数据
     * @returns {Array} 转换后的数据
     */
    convertToStandardFormat(rawData) {
        return rawData.map(row => {
            // 解析input字段中的JSON
            let inputText = '';
            let inputMedia = [];

            try {
                if (row.input) {
                    const inputData = JSON.parse(row.input);
                    if (inputData.user_input) {
                        const userInputArray = JSON.parse(inputData.user_input);
                        userInputArray.forEach(item => {
                            if (item.type === 'text') {
                                inputText += item.text + ' ';
                            } else if (item.type === 'image' && item.image_url) {
                                inputMedia.push({
                                    type: 'image',
                                    url: item.image_url
                                });
                            }
                        });
                    }
                }
            } catch (e) {
                inputText = row.input || '';
            }

            // 解析output字段中的生成图片/视频URL
            let outputText = row.output || '';
            let outputMedia = [];

            // 从output中提取生成的图片URL - 扩展匹配模式和兜底处理
            if (outputText) {
                // 多层次URL匹配策略
                const imageUrlPatterns = [
                    // 精确匹配已知格式
                    /https:\/\/liblibai-online\.liblib\.cloud\/agent_images\/[a-f0-9-]+\.(png|jpg|jpeg|gif|webp|mp4|mov|avi)/gi,
                    /https:\/\/liblibai-online\.liblib\.cloud\/sd-images\/[a-f0-9-]+\.(png|jpg|jpeg|gif|webp|mp4|mov|avi)/gi,
                    
                    // 兜底匹配：任何liblib.cloud域名的媒体文件
                    /https:\/\/[^\/\s]*\.?liblib\.cloud\/[^\/\s]+\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|mp4|mov|avi|pdf)/gi,
                    
                    // 更宽泛的兜底：任何包含常见媒体扩展名的HTTPS URL
                    /https:\/\/[^\s,;)]+\.(png|jpg|jpeg|gif|webp|mp4|mov|avi)/gi
                ];
                
                imageUrlPatterns.forEach((regex, index) => {
                    const matches = outputText.match(regex);
                    if (matches) {
                        matches.forEach(url => {
                            // 清理URL末尾可能的标点符号
                            let cleanUrl = url.replace(/[,;)\]\}]+$/, '');
                            
                            // 避免重复添加
                            if (!outputMedia.some(media => media.url === cleanUrl)) {
                                const isVideo = /\.(mp4|mov|avi)$/i.test(cleanUrl);
                                const isPdf = /\.pdf$/i.test(cleanUrl);
                                
                                outputMedia.push({
                                    type: isVideo ? 'video' : (isPdf ? 'document' : 'image'),
                                    url: cleanUrl,
                                    source: `pattern_${index + 1}` // 记录匹配来源便于调试
                                });
                            }
                        });
                    }
                });
                
                // 额外兜底：手动搜索可能被遗漏的URL
                const fallbackUrls = [];
                const lines = outputText.split('\n');
                lines.forEach(line => {
                    // 查找包含关键字的行
                    if (line.includes('http') && (line.includes('liblib') || line.includes('generated') || line.includes('image'))) {
                        const urlMatch = line.match(/https:\/\/[^\s,;)]+/g);
                        if (urlMatch) {
                            urlMatch.forEach(url => {
                                const cleanUrl = url.replace(/[,;)\]\}]+$/, '');
                                if (cleanUrl.match(/\.(png|jpg|jpeg|gif|webp|mp4|mov|avi|pdf)$/i)) {
                                    fallbackUrls.push(cleanUrl);
                                }
                            });
                        }
                    }
                });
                
                // 添加兜底找到的URL
                fallbackUrls.forEach(url => {
                    if (!outputMedia.some(media => media.url === url)) {
                        const isVideo = /\.(mp4|mov|avi)$/i.test(url);
                        const isPdf = /\.pdf$/i.test(url);
                        
                        outputMedia.push({
                            type: isVideo ? 'video' : (isPdf ? 'document' : 'image'),
                            url: url,
                            source: 'fallback_search'
                        });
                    }
                });
            }

            // 解析AI处理步骤
            const aiSteps = this.parseAISteps(outputText);

            return {
                id: row.id || '',
                timestamp: row.timestamp || '',
                userId: row.userId || '',
                sessionId: row.sessionId || '',
                input: inputText.trim(),
                output: outputText,
                aiSteps: aiSteps, // 新增：AI处理步骤
                inputMedia: inputMedia,
                outputMedia: outputMedia,
                originalRow: row // 保留原始数据以备需要
            };
        });
    }

    /**
     * 按会话ID分组数据（用于多轮对话）
     * @param {Array} data - 转换后的标准数据
     * @returns {Array} 按会话分组的数据
     */
    groupBySession(data) {
        const sessions = {};
        
        data.forEach(row => {
            const sessionId = row.sessionId || 'unknown';
            if (!sessions[sessionId]) {
                sessions[sessionId] = {
                    sessionId: sessionId,
                    userId: row.userId,
                    turns: []
                };
            }
            sessions[sessionId].turns.push(row);
        });

        // 对每个会话的轮次进行排序
        Object.keys(sessions).forEach(sessionId => {
            sessions[sessionId].turns.sort((a, b) => {
                const timeA = new Date(a.timestamp);
                const timeB = new Date(b.timestamp);
                return timeA - timeB;
            });
        });

        return Object.values(sessions);
    }
}

module.exports = CSVProcessor;