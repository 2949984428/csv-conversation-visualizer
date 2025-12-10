#!/bin/bash

# CSV可视化工具 - 本地启动脚本
echo "🚀 启动CSV可视化工具..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在csv-visualizer目录下运行此脚本"
    echo "当前目录: $(pwd)"
    echo "请使用: cd /Users/mac/Desktop/ai-pm/csv-visualizer && ./start-local.sh"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 检查端口占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口3000已被占用，正在关闭占用进程..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "🌐 启动服务器..."
npm start &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 3

# 检查服务器状态
if curl -s http://localhost:3000 >/dev/null; then
    echo ""
    echo "✅ 服务器启动成功！"
    echo "📱 访问地址: http://localhost:3000"
    echo "🔧 进程ID: $SERVER_PID"
    echo ""
    echo "💡 使用说明:"
    echo "  1. 上传CSV文件（支持拖拽）"
    echo "  2. 选择展示模板（自动推荐）"
    echo "  3. 查看AI处理步骤详情"
    echo "  4. 自动生成并下载HTML文件"
    echo ""
    echo "🛑 停止服务: Ctrl+C 或者 kill $SERVER_PID"
    echo ""
    
    # 尝试自动打开浏览器
    if command -v open &> /dev/null; then
        echo "🌍 正在打开浏览器..."
        open "http://localhost:3000"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3000"
    else
        echo "💻 请手动在浏览器中打开: http://localhost:3000"
    fi
    
    # 保持脚本运行，直到用户按Ctrl+C
    echo "按 Ctrl+C 停止服务器..."
    wait $SERVER_PID
else
    echo "❌ 服务器启动失败"
    echo "请检查端口3000是否可用: lsof -i :3000"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi