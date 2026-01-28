const express = require('express');
const router = express.Router();
const { User, Program, VoteRecord } = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 配置文件上传中间件
const multer = require('multer');
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件(.xlsx, .xls)'), false);
    }
  }
});

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 获取所有投票结果
router.get('/results', async (req, res) => {
  try {
    // 获取所有节目及其得票情况
    const programs = await Program.findAll();
    
    // 获取投票统计信息
    const votedUsers = await User.count({ where: { hasVoted: true } });
    const totalUsers = await User.count();
    
    // 按奖项类型排序，找出每个奖项的前三名
    const bestProgramWinners = [...programs]
      .sort((a, b) => b.bestProgram - a.bestProgram)
      .slice(0, 3);
    
    const bestPerformanceWinners = [...programs]
      .sort((a, b) => b.bestPerformance - a.bestPerformance)
      .slice(0, 3);
    
    const bestCreativityWinners = [...programs]
      .sort((a, b) => b.bestCreativity - a.bestCreativity)
      .slice(0, 3);
    
    return res.status(200).json({
      message: '获取投票结果成功',
      statistics: {
        votedUsers,
        totalUsers,
        votingRate: totalUsers > 0 ? (votedUsers / totalUsers * 100).toFixed(2) + '%' : '0%'
      },
      programs,
      winners: {
        bestProgram: bestProgramWinners,
        bestPerformance: bestPerformanceWinners,
        bestCreativity: bestCreativityWinners
      }
    });
  } catch (error) {
    console.error('获取投票结果失败:', error);
    return res.status(500).json({ message: '获取投票结果失败，请稍后重试' });
  }
});



// Excel导入用户
router.post('/import-users', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传Excel文件' });
    }

    const filePath = req.file.path;
    
    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON
    const usersData = XLSX.utils.sheet_to_json(worksheet);
    
    // 验证数据格式
    if (!usersData || usersData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Excel文件中没有数据' });
    }
    
    // 导入用户数据
    let successCount = 0;
    let failedCount = 0;
    const importedUsers = [];
    
    for (const userData of usersData) {
      try {
        // 验证必要字段
        if (!userData.name || !userData.employeeId) {
          failedCount++;
          continue;
        }
        
        // 创建或更新用户
        const [user, created] = await User.findOrCreate({
          where: { employeeId: userData.employeeId },
          defaults: {
            name: userData.name,
            role: userData.role || 'user',
            hasVoted: false
          }
        });
        
        if (created) {
          successCount++;
          importedUsers.push({
            id: user.id,
            name: user.name,
            employeeId: user.employeeId,
            created: true
          });
        } else {
          // 更新现有用户
          await user.update({
            name: userData.name,
            role: userData.role || user.role
          });
          successCount++;
          importedUsers.push({
            id: user.id,
            name: user.name,
            employeeId: user.employeeId,
            created: false
          });
        }
      } catch (error) {
        console.error('导入用户失败:', error);
        failedCount++;
      }
    }
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    return res.status(200).json({
      message: 'Excel导入完成',
      results: {
        total: usersData.length,
        success: successCount,
        failed: failedCount,
        importedUsers
      }
    });
  } catch (error) {
    console.error('Excel导入失败:', error);
    
    // 清理临时文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('删除临时文件失败:', err);
      }
    }
    
    return res.status(500).json({ message: 'Excel导入失败: ' + error.message });
  }
});

// 重置投票结果
router.post('/reset-votes', async (req, res) => {
  try {
    // 开始事务处理
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();
    
    try {
      // 清除所有投票记录
      await VoteRecord.destroy({ where: {}, transaction });
      
      // 重置所有节目的得票数
      await Program.update(
        {
          bestProgram: 0,
          bestPerformance: 0,
          bestCreativity: 0
        },
        { where: {}, transaction }
      );
      
      // 重置所有用户的投票状态
      await User.update(
        { hasVoted: false },
        { where: {}, transaction }
      );
      
      // 提交事务
      await transaction.commit();
      
      return res.status(200).json({ 
        message: '投票结果重置成功'
      });
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      console.error('重置投票结果失败:', error);
      return res.status(500).json({ message: '重置投票结果失败' });
    }
  } catch (error) {
    console.error('重置投票结果失败:', error);
    return res.status(500).json({ message: '重置投票结果失败' });
  }
});

// 清空用户表
router.post('/cleanup-users', async (req, res) => {
  try {
    // 开始事务处理
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();
    
    try {
      // 清空所有投票记录
      await VoteRecord.destroy({ where: {}, transaction });
      
      // 清空所有用户（保留root账户）
      await User.destroy({
        where: { employeeId: { [Op.ne]: 'root' } },
        transaction
      });
      
      // 重置所有节目的得票数
      await Program.update(
        {
          bestProgram: 0,
          bestPerformance: 0,
          bestCreativity: 0
        },
        { where: {}, transaction }
      );
      
      // 提交事务
      await transaction.commit();
      
      return res.status(200).json({ 
        message: '用户表清空成功'
      });
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      console.error('清空用户表失败:', error);
      return res.status(500).json({ message: '清空用户表失败' });
    }
  } catch (error) {
    console.error('清空用户表失败:', error);
    return res.status(500).json({ message: '清空用户表失败' });
  }
});

module.exports = router;