#!/bin/bash

# 部署脚本 - Ubuntu 24.04

echo "========================================"
echo "开始部署投票系统"
echo "========================================"

# 更新系统包
echo "1. 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装依赖
echo "2. 安装必要依赖..."
sudo apt install -y curl git build-essential

# 安装 Node.js (使用 nvm)
echo "3. 安装 Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 激活 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 安装指定版本的 Node.js
nvm install 22.16.0
nvm use 22.16.0

# 安装 pnpm
echo "4. 安装 pnpm..."
npm install -g pnpm

# 克隆项目（假设使用 git 仓库）
echo "5. 克隆项目代码..."
if [ ! -d "vote" ]; then
  git clone <your-repo-url> vote
fi

cd vote

# 安装前端依赖
echo "6. 安装前端依赖..."
pnpm install

# 安装后端依赖
echo "7. 安装后端依赖..."
cd server
npm install

# 创建必要的目录
echo "8. 创建必要的目录..."
mkdir -p uploads

# 配置环境变量
echo "9. 配置环境变量..."
cat > .env << EOF
# 服务器配置
PORT=3001

# 数据库配置
DB_TYPE=sqlite
EOF

echo "========================================"
echo "部署完成！"
echo "========================================"
echo "使用方法："
echo "1. 进入项目目录: cd vote"
echo "2. 构建前端: ./build.sh"
echo "3. 启动系统: ./start.sh"
echo "========================================"