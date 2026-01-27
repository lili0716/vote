const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const voteRoutes = require('./routes/vote');
const adminRoutes = require('./routes/admin');
const syncRoutes = require('./routes/sync');

// 初始化Express应用
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由配置
app.use('/api/login', authRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sync', syncRoutes);

// 健康检查接口
app.get('/api/health', (req, res) => {
  return res.status(200).json({ message: '服务运行正常' });
});

// 404处理
app.use((req, res) => {
  return res.status(404).json({ message: '接口不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  return res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;