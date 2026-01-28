#!/bin/bash

# 构建脚本
echo "========================================"
echo "开始构建前端项目"
echo "========================================"

# 激活 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm use 22.16.0

# 构建前端
echo "构建前端项目..."
pnpm run build

if [ $? -eq 0 ]; then
  echo "========================================"
  echo "前端构建成功！"
  echo "========================================"
else
  echo "========================================"
  echo "前端构建失败！"
  echo "========================================"
  exit 1
fi