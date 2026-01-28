#!/bin/bash

# 部署脚本 - Ubuntu 24.04
# 功能：一键完成环境配置、依赖安装、代码拉取和服务部署
echo "========================================"
echo "开始部署投票系统"
echo "========================================"

# 更换为中国镜像源，加速下载
echo "0. 更换为中国镜像源..."
sudo sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list.d/security.sources.list
sudo sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
sudo sed -i 's/ports.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list

# 安装依赖
echo "1. 安装必要依赖..."
sudo apt install -y curl git build-essential

# 安装 Node.js (使用 nvm)
echo "2. 安装 Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 激活 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 安装指定版本的 Node.js
nvm install 22.16.0
nvm use 22.16.0

# 安装 pnpm
echo "3. 安装 pnpm..."
npm install -g pnpm

# 克隆项目
echo "4. 克隆项目代码..."
if [ ! -d "vote" ]; then
  git clone git@github.com:lili0716/vote.git vote
fi

cd vote

# 安装前端依赖
echo "5. 安装前端依赖..."
pnpm install

# 安装后端依赖
echo "6. 安装后端依赖..."
cd server
npm install

# 创建必要的目录
echo "7. 创建必要的目录..."
mkdir -p uploads

# 配置环境变量
echo "8. 配置环境变量..."
cat > .env << EOF
# 服务器配置
PORT=3001

# 数据库配置
DB_TYPE=sqlite
EOF

cd ..

# 构建前端项目
echo "9. 构建前端项目..."
pnpm run build

# 配置 Nginx
echo "10. 配置 Nginx..."
sudo apt install -y nginx

# 创建 Nginx 配置文件
cat > vote.conf << EOF
# Nginx 配置文件
# 用于部署投票系统

server {
    listen 80;
    server_name localhost;

    # 前端静态文件
    location / {
        root /home/ubuntu/vote/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /home/ubuntu/vote/dist;
    }
}
EOF

# 复制 Nginx 配置文件到 sites-available 目录
sudo cp vote.conf /etc/nginx/sites-available/vote.conf

# 移除可能存在的旧配置符号链接
sudo rm -f /etc/nginx/sites-enabled/vote* 2>/dev/null

# 创建新的符号链接
sudo ln -sf /etc/nginx/sites-available/vote.conf /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 开放防火墙端口
echo "11. 配置防火墙..."
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001
sudo ufw reload

# 创建启动脚本
echo "12. 创建启动脚本..."
cat > start.sh << 'EOF'
#!/bin/bash

# 启动脚本 - 先启动后端，再启动前端
echo "========================================"
echo "启动投票系统"
echo "========================================"

# 进入项目目录
cd "$(dirname "$0")"

# 启动后端服务
echo "1. 启动后端服务..."
cd server
npm run start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动，PID: $BACKEND_PID"

# 等待后端服务启动完成
sleep 3

# 启动前端服务
echo "2. 启动前端服务..."
cd ..
pnpm run preview -- --host 0.0.0.0 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动，PID: $FRONTEND_PID"

# 保存进程ID到文件
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo "========================================"
echo "服务启动完成！"
echo "========================================"
echo "服务访问地址："
echo "- 前端应用: http://localhost:4173"
echo "- 后端 API: http://localhost:3001"
echo "========================================"
echo "停止服务命令： ./stop.sh"
echo "========================================"
EOF

# 创建停止脚本
cat > stop.sh << 'EOF'
#!/bin/bash

# 停止脚本 - 停止前后端服务
echo "========================================"
echo "停止投票系统"
echo "========================================"

# 进入项目目录
cd "$(dirname "$0")"

# 停止后端服务
if [ -f "backend.pid" ]; then
  BACKEND_PID=$(cat backend.pid)
  echo "停止后端服务，PID: $BACKEND_PID"
  kill $BACKEND_PID 2>/dev/null
  rm -f backend.pid
fi

# 停止前端服务
if [ -f "frontend.pid" ]; then
  FRONTEND_PID=$(cat frontend.pid)
  echo "停止前端服务，PID: $FRONTEND_PID"
  kill $FRONTEND_PID 2>/dev/null
  rm -f frontend.pid
fi

echo "========================================"
echo "服务已停止！"
echo "========================================"
EOF

# 设置脚本执行权限
chmod +x start.sh
chmod +x stop.sh

echo "========================================"
echo "部署完成！"
echo "========================================"
echo "使用方法："
echo "1. 进入项目目录: cd vote"
echo "2. 启动系统: ./start.sh"
echo "3. 停止系统: ./stop.sh"
echo "========================================"
echo "服务访问地址："
echo "- 前端应用: http://localhost:4173"
echo "- 后端 API: http://localhost:3001"
echo "========================================"
