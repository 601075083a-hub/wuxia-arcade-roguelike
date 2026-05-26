const EXTERNALS = [
  {
    id: "diamond_style",
    name: "金刚伏魔拳",
    unlockedMoves: ["diamond_fist"],
    passiveModifiers: [{ tag: "punch", damageMultiplier: 1.25 }]
  },
  {
    id: "dragon_style",
    name: "降龙掌",
    unlockedMoves: ["dragon_regret", "ultimate_dragon"],
    passiveModifiers: [{ tag: "burst", damageMultiplier: 1.35 }]
  },
  {
    id: "rain_style",
    name: "暴雨梨花",
    unlockedMoves: ["flower_rain"],
    passiveModifiers: [{ tag: "kick", damageMultiplier: 1.15 }]
  },
  {
    id: "sword_style",
    name: "独孤九剑",
    unlockedMoves: ["nine_sword"],
    passiveModifiers: [{ tag: "combo", damageMultiplier: 1.25 }]
  },
  {
    id: "luohan_style",
    name: "罗汉拳",
    unlockedMoves: [],
    passiveModifiers: [{ tag: "guard", bonusBlock: 4 }]
  },
  {
    id: "taiji_style",
    name: "太极拳",
    unlockedMoves: ["tiger_breaker"],
    passiveModifiers: [{ tag: "break", damageMultiplier: 1.2 }]
  }
];

module.exports = {
  EXTERNALS
};
