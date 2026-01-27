// 远程数据库连接配置
// 用于从远程数据库同步用户信息

const mysql = require('mysql2/promise');

class RemoteDBConfig {
  constructor(config) {
    this.config = config;
    this.pool = null;
  }

  // 初始化数据库连接池
  async init() {
    try {
      this.pool = mysql.createPool({
        host: this.config.host,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      
      // 测试连接
      const connection = await this.pool.getConnection();
      console.log('远程数据库连接成功');
      connection.release();
      
      return true;
    } catch (error) {
      console.error('远程数据库连接失败:', error);
      return false;
    }
  }

  // 获取数据库连接池
  getPool() {
    return this.pool;
  }

  // 关闭数据库连接
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('远程数据库连接已关闭');
    }
  }

  // 从远程数据库获取用户信息
  async getUsers(tableName, filterField, filterValue) {
    try {
      const pool = this.getPool();
      if (!pool) {
        throw new Error('数据库连接未初始化');
      }

      let query = `SELECT * FROM ${tableName}`;
      let params = [];

      // 添加筛选条件
      if (filterField && filterValue !== undefined) {
        query += ` WHERE ${filterField} = ?`;
        params.push(filterValue);
      }

      const [rows] = await pool.execute(query, params);
      console.log('从远程数据库获取用户信息成功，共', rows.length, '条记录');
      
      return rows;
    } catch (error) {
      console.error('从远程数据库获取用户信息失败:', error);
      throw error;
    }
  }
}

module.exports = RemoteDBConfig;