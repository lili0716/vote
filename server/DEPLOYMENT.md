# 后端服务独立部署说明

本指南将帮助你将投票系统的后端服务独立部署到任何支持Node.js的服务器上。

## 系统要求

- Node.js 14.0 或更高版本
- npm 6.0 或更高版本
- 足够的磁盘空间用于存储代码和数据库文件

## 部署步骤

### 1. 准备部署文件

1. **复制server目录到部署服务器**
   - 可以使用FTP、SCP或其他文件传输工具
   - 确保完整复制整个server目录结构

2. **安装依赖**
   ```bash
   # 进入server目录
   cd server
   
   # 安装依赖
   npm install
   ```

### 2. 配置环境变量（可选）

如果需要自定义服务器端口，可以设置环境变量：

```bash
# Linux/macOS
export PORT=3001

# Windows (CMD)
set PORT=3001

# Windows (PowerShell)
$env:PORT=3001
```

### 3. 启动服务

#### 方式一：直接启动（适合开发和测试）

```bash
npm start
```

#### 方式二：使用进程管理工具（适合生产环境）

推荐使用PM2来管理Node.js进程：

```bash
# 安装PM2
npm install -g pm2

# 启动服务
npm start

# 或者使用PM2直接启动
pm2 start app.js

# 查看服务状态
pm2 status

# 停止服务
pm2 stop app
```

### 4. 验证部署

服务启动后，可以通过以下方式验证：

1. **健康检查**
   ```bash
   curl http://localhost:3001/api/health
   ```
   预期返回：`{"message":"服务运行正常"}`

2. **测试登录接口**
   ```bash
   curl -X POST http://localhost:3001/login \
     -H "Content-Type: application/json" \
     -d '{"employeeId":"test"}'
   ```

3. **测试获取节目列表**
   ```bash
   curl http://localhost:3001/api/vote/programs
   ```

## 数据库管理

本后端使用SQLite数据库，数据库文件会自动生成在server目录下的`database.sqlite`。

### 数据库备份

定期备份`database.sqlite`文件以防止数据丢失：

```bash
# 备份数据库
cp database.sqlite database.sqlite.backup
```

### 数据库重置

如果需要重置数据库，只需删除`database.sqlite`文件，重启服务后会自动重新创建：

```bash
# 删除数据库文件
rm database.sqlite

# 重启服务
npm restart
```

## 安全注意事项

1. **服务器防火墙**
   - 确保服务器防火墙只开放必要的端口（默认为3001）
   - 建议在生产环境中使用HTTPS

2. **API访问控制**
   - 目前API没有实现复杂的认证机制
   - 建议在生产环境中添加适当的认证和授权

3. **数据安全**
   - SQLite数据库文件应设置适当的权限，防止未授权访问
   - 定期备份数据库

## 监控和维护

1. **日志管理**
   - 服务运行日志会输出到控制台
   - 使用PM2时，可以通过`pm2 logs`查看日志

2. **服务状态监控**
   - 使用`pm2 status`查看服务状态
   - 可以设置PM2的自动重启功能

3. **性能优化**
   - 对于大规模投票，可以考虑使用更强大的数据库（如PostgreSQL或MySQL）
   - 可以添加缓存机制来提高性能

## 常见问题

### Q: 服务启动后无法访问

**A:** 检查以下几点：
- 服务器防火墙是否开放了对应端口
- 服务是否正常运行（使用`pm2 status`或查看日志）
- 网络连接是否正常

### Q: 数据库文件损坏

**A:** 使用备份的数据库文件恢复，或删除损坏的文件并重启服务（会丢失所有数据）。

### Q: 服务运行缓慢

**A:** 检查服务器资源使用情况，考虑：
- 增加服务器内存
- 优化数据库查询
- 使用更强大的数据库系统

## 技术支持

如果遇到部署问题，可以参考以下资源：
- [Node.js官方文档](https://nodejs.org/docs/latest-v14.x/api/)
- [Express.js官方文档](https://expressjs.com/en/starter/installing.html)
- [SQLite官方文档](https://www.sqlite.org/docs.html)

---

部署完成后，后端服务将独立运行，可以与任何前端应用集成使用。