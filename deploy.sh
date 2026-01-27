#!/bin/bash

# 部署脚本 - Ubuntu 24.04
# 功能：一键完成环境配置、依赖安装和前端构建
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

# 克隆项目
echo "5. 克隆项目代码..."
if [ ! -d "vote" ]; then
  git clone git@github.com:lili0716/vote.git vote
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

cd ..

# 构建前端项目
echo "10. 构建前端项目..."
pnpm run build

# 配置 Nginx
echo "11. 配置 Nginx..."
sudo apt install -y nginx

# 复制 Nginx 配置文件到 sites-available 目录
sudo cp nginx.conf /etc/nginx/sites-available/vote.conf

# 移除可能存在的旧配置符号链接
sudo rm -f /etc/nginx/sites-enabled/vote* 2>/dev/null

# 创建新的符号链接
sudo ln -sf /etc/nginx/sites-available/vote.conf /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 开放防火墙端口
echo "12. 配置防火墙..."
sudo ufw allow 80
sudo ufw allow 443
sudo ufw reload

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

echo "========================================"
echo "部署完成！"
echo "========================================"
echo "使用方法："
echo "1. 进入项目目录: cd vote"
echo "2. 启动系统: ./start.sh"
echo "========================================"
echo "服务访问地址："
echo "- 前端应用: http://localhost:4173"
echo "- 后端 API: http://localhost:3001"
echo "========================================"