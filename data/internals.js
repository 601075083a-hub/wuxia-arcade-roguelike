const INTERNALS = [
  {
    id: "jiuyang",
    name: "九阳神功",
    shortName: "九阳",
    ruleHooks: ["freeFirstMove"],
    description: "每回合首次出招不消耗出招次数。",
    combatText: "首招免费"
  },
  {
    id: "beiming",
    name: "北冥神功",
    shortName: "北冥",
    ruleHooks: ["discardDraw"],
    description: "回合结束时，每弃 2 张牌，下回合额外抽 1 张，最多 +2。",
    combatText: "弃牌抽牌"
  },
  {
    id: "yijin",
    name: "易筋经",
    shortName: "易筋",
    ruleHooks: ["formalDamageBoost"],
    description: "正式招式伤害 +15%。",
    combatText: "正式增伤"
  },
  {
    id: "wuxiang",
    name: "小无相功",
    shortName: "无相",
    ruleHooks: ["basicDamageBoost"],
    description: "普通拳和普通腿伤害 +4。",
    combatText: "普攻强化"
  },
  {
    id: "xiantian",
    name: "先天功",
    shortName: "先天",
    ruleHooks: ["thinDeck"],
    description: "战斗开始时临时移除 1 张方向碎片。",
    combatText: "临时瘦牌"
  },
  {
    id: "longxiang",
    name: "龙象般若功",
    shortName: "龙象",
    ruleHooks: ["handPower"],
    description: "手牌每有 1 张，招式伤害 +5%，最多 +30%。",
    combatText: "手牌增伤"
  }
];

module.exports = {
  INTERNALS
};
