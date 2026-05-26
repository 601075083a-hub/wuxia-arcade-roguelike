const ENEMIES = {
  bandit: {
    id: "bandit",
    name: "山贼",
    maxHp: 42,
    block: 0,
    intents: [
      { type: "attack", value: 7, label: "劈砍 7" },
      { type: "block", value: 6, label: "架势 6" }
    ],
    rewards: { gold: 12 }
  },
  swordsman: {
    id: "swordsman",
    name: "游侠剑客",
    maxHp: 55,
    block: 0,
    intents: [
      { type: "attack", value: 9, label: "快剑 9" },
      { type: "attackBlock", value: 6, block: 5, label: "攻守 6/5" }
    ],
    rewards: { gold: 15 }
  },
  monk: {
    id: "monk",
    name: "铜人僧",
    maxHp: 68,
    block: 6,
    intents: [
      { type: "block", value: 10, label: "金钟 10" },
      { type: "attack", value: 11, label: "重掌 11" }
    ],
    rewards: { gold: 18 }
  },
  assassin: {
    id: "assassin",
    name: "唐门刺客",
    maxHp: 50,
    block: 0,
    intents: [
      { type: "attack", value: 8, hits: 2, label: "连针 8x2" },
      { type: "debuff", value: 2, label: "施毒 2" }
    ],
    rewards: { gold: 20 }
  },
  elite: {
    id: "elite",
    name: "黑衣高手",
    maxHp: 86,
    block: 4,
    intents: [
      { type: "attack", value: 14, label: "破空掌 14" },
      { type: "attackBlock", value: 9, block: 8, label: "攻守 9/8" },
      { type: "block", value: 14, label: "护体 14" }
    ],
    rewards: { gold: 28, rare: true }
  },
  boss: {
    id: "boss",
    name: "魔教护法",
    maxHp: 150,
    block: 8,
    intents: [
      { type: "attack", value: 18, label: "炎掌 18" },
      { type: "attack", value: 10, hits: 2, label: "双煞 10x2" },
      { type: "block", value: 18, label: "魔焰护体" },
      { type: "debuff", value: 3, label: "心魔 3" }
    ],
    rewards: { gold: 60, boss: true }
  }
};

module.exports = {
  ENEMIES
};
