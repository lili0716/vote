const sequelize = require('../config/database');
const User = require('./User');
const Program = require('./Program');
const VoteRecord = require('./VoteRecord');
const initConfig = require('../config/initConfig');

// 定义模型关联关系
VoteRecord.belongsTo(Program, {
  foreignKey: 'programId',
  as: 'program'
});

User.hasMany(VoteRecord, {
  foreignKey: 'userId',
  as: 'voteRecords'
});

// 同步数据库模型
sequelize.sync({
  force: false
}).then(async () => {
  console.log('数据库模型同步成功');
  
  try {
    // 创建默认root账户
    await User.findOrCreate({
      where: { employeeId: initConfig.rootAccount.employeeId },
      defaults: initConfig.rootAccount
    });
    console.log('默认root账户创建成功');
    console.log('Root账户配置:', initConfig.rootAccount);
    
    // 创建默认节目数据
    const defaultPrograms = initConfig.programs;
    
    for (const program of defaultPrograms) {
      await Program.findOrCreate({
        where: { name: program.name },
        defaults: program
      });
    }
    
    console.log('默认节目数据创建成功');
    console.log('节目数量:', defaultPrograms.length);
    console.log('奖项类型:', initConfig.awardTypes.length);
    initConfig.awardTypes.forEach(award => {
      console.log('-', award.name, '(', award.key, ')');
    });
    
    // 创建测试账号
    if (initConfig.testAccounts && initConfig.testAccounts.length > 0) {
      for (const account of initConfig.testAccounts) {
        await User.findOrCreate({
          where: { employeeId: account.employeeId },
          defaults: account
        });
      }
      console.log('测试账号创建成功');
      console.log('测试账号数量:', initConfig.testAccounts.length);
      initConfig.testAccounts.forEach(account => {
        console.log('-', account.name, '(', account.employeeId, ')');
      });
    }
  } catch (error) {
    console.error('初始化默认数据失败:', error);
  }
}).catch(err => {
  console.error('数据库模型同步失败:', err);
});

module.exports = {
  sequelize,
  User,
  Program,
  VoteRecord
};