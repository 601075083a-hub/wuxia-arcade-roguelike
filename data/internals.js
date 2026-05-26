const INTERNALS = [
  {
    id: "jiuyang",
    name: "九阳神功",
    ruleHooks: ["freeFirstMove"],
    description: "每回合第一次出招不消耗出招次数。"
  },
  {
    id: "beiming",
    name: "北冥神功",
    ruleHooks: ["discardDraw"],
    description: "回合结束每弃 2 张碎片，下回合额外抽 1 张。"
  },
  {
    id: "yijin",
    name: "易筋经",
    ruleHooks: ["directionFlex"],
    description: "方向碎片更灵活，招式伤害 +10%。"
  },
  {
    id: "wuxiang",
    name: "小无相功",
    ruleHooks: ["attackFlex"],
    description: "拳腿招式伤害 +10%。"
  },
  {
    id: "xiantian",
    name: "先天功",
    ruleHooks: ["thinDeck"],
    description: "战斗开始时暂时移除 1 张方向碎片。"
  },
  {
    id: "longxiang",
    name: "龙象般若功",
    ruleHooks: ["handPower"],
    description: "手牌每有 1 张，招式伤害 +5%。"
  }
];

module.exports = {
  INTERNALS
};
