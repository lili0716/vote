// 同步服务
// 用于从远程数据库同步用户信息到本地员工表

const RemoteDBConfig = require('../config/remoteDBConfig');
const { User } = require('../models');

class SyncService {
  // 同步用户信息
  static async syncUsers(remoteDBConfig, tableName, filterField, filterValue) {
    try {
      console.log('开始同步用户信息...');
      console.log('远程数据库配置:', {
        host: remoteDBConfig.host,
        user: remoteDBConfig.user,
        database: remoteDBConfig.database,
        tableName,
        filterField,
        filterValue
      });

      // 初始化远程数据库连接
      const remoteDB = new RemoteDBConfig(remoteDBConfig);
      const isConnected = await remoteDB.init();
      
      if (!isConnected) {
        throw new Error('远程数据库连接失败');
      }

      // 从远程数据库获取用户信息
      const remoteUsers = await remoteDB.getUsers(tableName, filterField, filterValue);
      
      // 同步到本地员工表
      const syncResults = {
        total: remoteUsers.length,
        success: 0,
        failed: 0,
        syncedUsers: []
      };

      for (const remoteUser of remoteUsers) {
        try {
          // 处理员工工号，确保是5位数格式
          let employeeId = remoteUser.employeeId || remoteUser.id || remoteUser.username;
          
          // 确保工号是字符串
          employeeId = String(employeeId);
          
          // 移除非数字字符
          const numericEmployeeId = employeeId.replace(/\D/g, '');
          // 补零到5位
          const formattedEmployeeId = numericEmployeeId.padStart(5, '0');

          // 处理员工姓名
          let name = remoteUser.name || remoteUser.username || formattedEmployeeId;

          // 同步到本地数据库
          const [user, created] = await User.findOrCreate({
            where: { employeeId: formattedEmployeeId },
            defaults: {
              name,
              employeeId: formattedEmployeeId,
              role: 'user'
            }
          });

          syncResults.syncedUsers.push({
            id: user.id,
            name: user.name,
            employeeId: user.employeeId,
            created: created
          });

          syncResults.success++;
          
        } catch (error) {
          console.error('同步用户失败:', error);
          syncResults.failed++;
        }
      }

      // 关闭远程数据库连接
      await remoteDB.close();

      console.log('用户信息同步完成:', syncResults);
      
      return syncResults;
      
    } catch (error) {
      console.error('同步用户信息失败:', error);
      throw error;
    }
  }
}

module.exports = SyncService;