const { Sequelize } = require('sequelize');

// 创建SQLite数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });

module.exports = sequelize;