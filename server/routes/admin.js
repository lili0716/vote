const express = require('express');
const router = express.Router();
const { User, Program } = require('../models');

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



module.exports = router;