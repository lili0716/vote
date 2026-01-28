const express = require('express');
const router = express.Router();
const { User, VoteRecord, Program } = require('../models');

// 登录接口
router.post('/', async (req, res) => {
  try {
    let { employeeId } = req.body;
    
    // 验证参数
    if (!employeeId) {
      return res.status(400).json({ message: '请输入工号' });
    }
    
    // 检查是否是root账户
    if (employeeId === 'root') {
      const rootUser = await User.findOne({ where: { employeeId: 'root' } });
      if (rootUser) {
        // 获取root用户的投票记录
        const voteRecords = await VoteRecord.findAll({
          where: { userId: rootUser.id },
          include: [{
            model: Program,
            as: 'program',
            attributes: ['id', 'name']
          }]
        });
        
        return res.status(200).json({
          message: '登录成功',
          user: {
            id: rootUser.id,
            name: rootUser.name,
            employeeId: rootUser.employeeId,
            role: rootUser.role,
            hasVoted: rootUser.hasVoted
          },
          voteRecords: voteRecords.map(vr => ({
            id: vr.id,
            programId: vr.programId,
            programName: vr.program ? vr.program.name : null,
            awardType: vr.awardType,
            createdAt: vr.createdAt
          }))
        });
      } else {
        return res.status(401).json({ message: 'Root账户不存在' });
      }
    }
    
    // 处理普通用户工号：不足5位时自动补零
    // 移除所有非数字字符，确保只保留数字
    const numericEmployeeId = employeeId.replace(/\D/g, '');
    // 补零到5位
    const formattedEmployeeId = numericEmployeeId.padStart(5, '0');
    
    console.log('原始工号:', employeeId);
    console.log('格式化后工号:', formattedEmployeeId);
    
    // 普通用户登录逻辑
    let user = await User.findOne({ where: { employeeId: formattedEmployeeId } });
    
    if (!user) {
      // 如果用户不存在，返回错误
      return res.status(401).json({ message: '工号未注册' });
    }
    
    // 获取用户的投票记录
    const voteRecords = await VoteRecord.findAll({
      where: { userId: user.id },
      include: [{
        model: Program,
        as: 'program',
        attributes: ['id', 'name']
      }]
    });
    
    return res.status(200).json({
      message: '登录成功',
      user: {
        id: user.id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        hasVoted: user.hasVoted
      },
      voteRecords: voteRecords.map(vr => ({
        id: vr.id,
        programId: vr.programId,
        programName: vr.program ? vr.program.name : null,
        awardType: vr.awardType,
        createdAt: vr.createdAt
      }))
    });
    
  } catch (error) {
    console.error('登录失败:', error);
    return res.status(500).json({ message: '登录失败，请稍后重试' });
  }
});

module.exports = router;