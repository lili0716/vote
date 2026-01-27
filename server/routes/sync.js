// 同步功能路由
// 用于处理从远程数据库同步用户信息的请求

const express = require('express');
const router = express.Router();
const SyncService = require('../services/syncService');

// 同步用户信息接口
router.post('/users', async (req, res) => {
  try {
    const {
      remoteDBConfig,
      tableName,
      filterField,
      filterValue
    } = req.body;

    // 验证参数
    if (!remoteDBConfig) {
      return res.status(400).json({ message: '请提供远程数据库配置' });
    }

    if (!tableName) {
      return res.status(400).json({ message: '请提供远程数据库表名' });
    }

    if (!remoteDBConfig.host || !remoteDBConfig.user || !remoteDBConfig.password || !remoteDBConfig.database) {
      return res.status(400).json({ message: '远程数据库配置不完整，需要提供host、user、password和database' });
    }

    // 执行同步操作
    const syncResults = await SyncService.syncUsers(
      remoteDBConfig,
      tableName,
      filterField,
      filterValue
    );

    return res.status(200).json({
      message: '用户信息同步成功',
      results: syncResults
    });

  } catch (error) {
    console.error('同步用户信息失败:', error);
    return res.status(500).json({
      message: '同步用户信息失败',
      error: error.message
    });
  }
});

module.exports = router;