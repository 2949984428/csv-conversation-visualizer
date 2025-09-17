#!/bin/bash

# 获取脚本所在目录
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$DIR"

echo "🚀 CSV可视化工具启动器"
echo "📂 工作目录: $DIR"

# 运行启动脚本
./start-local.sh