#!/bin/bash

# CSV对话数据可视化工具 - 启动脚本
echo "🚀 正在启动CSV对话数据可视化工具..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到Node.js，请先安装Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未检测到npm"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
fi

# 启动服务器
echo "🖥️ 启动服务器..."
npm start &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 3

# 检查服务器是否成功启动
if curl -s "http://localhost:3000/api/health" > /dev/null; then
    echo "✅ 服务器启动成功！"
    echo ""
    echo "🌐 访问地址: http://localhost:3000"
    echo "📚 使用说明:"
    echo "   1. 上传你的CSV文件"
    echo "   2. 选择合适的展示模板"
    echo "   3. 生成并下载可视化HTML文件"
    echo ""
    echo "🔧 控制命令:"
    echo "   停止服务器: Ctrl+C 或 kill $SERVER_PID"
    echo "   查看日志: tail -f logs/app.log"
    echo ""
    
    # 自动打开浏览器
    if command -v open &> /dev/null; then
        echo "🌍 正在打开浏览器..."
        open "http://localhost:3000"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3000"
    fi
    
    # 保持脚本运行
    wait $SERVER_PID
else
    echo "❌ 服务器启动失败"
    echo "请检查端口3000是否被占用: lsof -i :3000"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi