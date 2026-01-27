#!/bin/bash

# 启动脚本
echo "========================================"
echo "开始启动投票系统"
echo "========================================"

# 激活 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm use 22.16.0

# 检查并安装 pm2
if ! command -v pm2 &> /dev/null; then
  echo "安装 pm2 进程管理器..."
  npm install -g pm2
fi

# 停止之前的进程
echo "停止之前的进程..."
pm2 stop all 2>/dev/null

# 启动后端服务器
echo "启动后端服务器..."
cd server
npm start &
sleep 3

# 启动前端预览服务器
echo "启动前端预览服务器..."
cd ..
pnpm run preview &

# 显示状态
echo "========================================"
echo "系统启动完成！"
echo "========================================"
echo "服务状态："
echo "- 后端服务器: http://localhost:3001"
echo "- 前端服务器: http://localhost:4173"
echo "========================================"
echo "查看运行状态: pm2 status"
echo "查看日志: pm2 logs"
echo "停止服务: pm2 stop all"
echo "========================================"