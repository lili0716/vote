// 初始化配置文件
// 用于定义节目和奖项的初始化数据

module.exports = {
  // 节目列表
  programs: [
    { name: '节目1' },
    { name: '节目2' },
    { name: '节目3' },
    { name: '节目4' },
    { name: '节目5' }
  ],
  
  // 奖项类型
  awardTypes: [
    {
      key: 'bestProgram',
      name: '最佳节目奖',
      description: '评选最受欢迎的节目'
    },
    {
      key: 'bestPerformance',
      name: '最佳表演奖',
      description: '评选最佳表演者'
    },
    {
      key: 'bestCreativity',
      name: '最佳创意奖',
      description: '评选最具创意的节目'
    }
  ],
  
  // 默认root账户配置
  rootAccount: {
    name: 'Root Admin',
    employeeId: 'root',
    role: 'admin'
  },
  
  // 测试账号配置
  testAccounts: [
    {
      name: '测试用户1',
      employeeId: '00001',
      role: 'user'
    },
    {
      name: '测试用户2',
      employeeId: '00002',
      role: 'user'
    },
    {
      name: '测试用户3',
      employeeId: '00003',
      role: 'user'
    }
  ]
};