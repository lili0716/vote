// 初始化配置文件
// 用于定义节目和奖项的初始化数据

module.exports = {
  // 节目列表
  programs: [
    { name: "炸雷", isGroup: true },
    { name: "小苹果", isGroup: false },
    { name: "《不放弃》《吟飞一直顺》", isGroup: true },
    { name: "往后余生", isGroup: true },
    { name: "女儿国之桃花劫", isGroup: true },
    { name: "为你祈祷", isGroup: false },
    { name: "大鱼", isGroup: false },
    { name: "老男孩", isGroup: false },
    { name: "象王行", isGroup: true },
    { name: "待定", isGroup: true },
  ],

  // 奖项类型
  awardTypes: [
    {
      key: "bestProgram",
      name: "最佳团体奖",
      description: "评选最受欢迎的节目",
    },
    {
      key: "bestPerformance",
      name: "最具氛围奖",
      description: "评选最佳表演者",
    },
    {
      key: "bestCreativity",
      name: "最佳创意奖",
      description: "评选最具创意的节目",
    },
  ],

  // 默认root账户配置
  rootAccount: {
    name: "Root Admin",
    employeeId: "root",
    role: "admin",
  },

  // 测试账号配置
  testAccounts: [
    {
      name: "测试用户1",
      employeeId: "00001",
      role: "user",
    },
    {
      name: "测试用户2",
      employeeId: "00002",
      role: "user",
    },
    {
      name: "测试用户3",
      employeeId: "00003",
      role: "user",
    },
  ],
};
