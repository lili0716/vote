const express = require('express');
const router = express.Router();
const { User, Program, VoteRecord } = require('../models');

// 获取所有节目列表
router.get('/programs', async (req, res) => {
  try {
    const programs = await Program.findAll();
    return res.status(200).json({
      message: '获取节目列表成功',
      programs
    });
  } catch (error) {
    console.error('获取节目列表失败:', error);
    return res.status(500).json({ message: '获取节目列表失败，请稍后重试' });
  }
});

// 提交投票
router.post('/submit', async (req, res) => {
  try {
    const { userId, votes } = req.body;
    
    // 验证参数
    if (!userId || !votes) {
      return res.status(400).json({ message: '请提供用户ID和投票数据' });
    }
    
    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 验证用户是否已经投过票
    if (user.hasVoted) {
      return res.status(400).json({ message: '您已经投过票了，不能重复投票' });
    }
    
    // 开始事务处理
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();
    
    try {
      // 保存投票记录
      for (const vote of votes) {
        await VoteRecord.create({
          userId: user.id,
          programId: vote.programId,
          awardType: vote.awardType
        }, { transaction });
        
        // 更新节目得票情况
        const program = await Program.findByPk(vote.programId, { transaction });
        if (program) {
          // 根据奖项类型更新得票数
          if (vote.awardType === 'bestProgram') {
            await program.increment('bestProgram', { by: 1, transaction });
          } else if (vote.awardType === 'bestPerformance') {
            await program.increment('bestPerformance', { by: 1, transaction });
          } else if (vote.awardType === 'bestCreativity') {
            await program.increment('bestCreativity', { by: 1, transaction });
          }
        }
      }
      
      // 更新用户投票状态
      await user.update({ hasVoted: true }, { transaction });
      
      // 提交事务
      await transaction.commit();
      
      return res.status(200).json({ message: '投票成功' });
      
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      console.error('投票失败:', error);
      return res.status(500).json({ message: '投票失败，请稍后重试' });
    }
    
  } catch (error) {
    console.error('提交投票失败:', error);
    return res.status(500).json({ message: '提交投票失败，请稍后重试' });
  }
});

// 获取用户投票记录
router.get('/user-votes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const voteRecords = await VoteRecord.findAll({
      where: { userId },
      include: [{
        model: Program,
        as: 'program',
        attributes: ['id', 'name']
      }]
    });
    
    return res.status(200).json({
      message: '获取投票记录成功',
      voteRecords
    });
  } catch (error) {
    console.error('获取投票记录失败:', error);
    return res.status(500).json({ message: '获取投票记录失败，请稍后重试' });
  }
});

module.exports = router;