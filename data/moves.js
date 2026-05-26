const MOVES = [
  {
    id: "swift_punch",
    name: "顺风拳",
    input: ["down", "right", "punch"],
    tags: ["punch"],
    baseDamage: 12,
    effects: [{ type: "damage", value: 12 }]
  },
  {
    id: "chain_punch",
    name: "连环拳",
    input: ["right", "right", "punch"],
    tags: ["punch", "combo"],
    baseDamage: 8,
    effects: [{ type: "damage", value: 8, hits: 2 }]
  },
  {
    id: "flying_kick",
    name: "飞踢",
    input: ["down", "up", "kick"],
    tags: ["kick"],
    baseDamage: 18,
    effects: [{ type: "damage", value: 18 }, { type: "weaken", value: 1 }]
  },
  {
    id: "guard_palm",
    name: "抱元掌",
    input: ["left", "punch"],
    tags: ["punch", "guard"],
    baseDamage: 7,
    effects: [{ type: "damage", value: 7 }, { type: "block", value: 6 }]
  },
  {
    id: "tiger_breaker",
    name: "伏虎拳",
    input: ["left", "down", "right", "punch"],
    tags: ["punch", "break"],
    baseDamage: 24,
    effects: [{ type: "damage", value: 24 }, { type: "vulnerable", value: 1 }]
  },
  {
    id: "whirlwind_kick",
    name: "旋风腿",
    input: ["down", "right", "up", "kick"],
    tags: ["kick", "aoe"],
    baseDamage: 22,
    effects: [{ type: "damage", value: 22 }, { type: "block", value: 4 }]
  },
  {
    id: "diamond_fist",
    name: "金刚拳",
    input: ["down", "right", "down", "punch"],
    tags: ["punch", "break"],
    baseDamage: 30,
    effects: [{ type: "damage", value: 30 }, { type: "vulnerable", value: 2 }]
  },
  {
    id: "dragon_regret",
    name: "亢龙有悔",
    input: ["right", "right", "right", "punch"],
    tags: ["punch", "burst"],
    baseDamage: 36,
    effects: [{ type: "damage", value: 36 }]
  },
  {
    id: "flower_rain",
    name: "漫天花雨",
    input: ["left", "right", "kick"],
    tags: ["kick", "poison"],
    baseDamage: 14,
    effects: [{ type: "damage", value: 14 }, { type: "poison", value: 3 }]
  },
  {
    id: "nine_sword",
    name: "破式一剑",
    input: ["up", "right", "punch"],
    tags: ["punch", "combo"],
    baseDamage: 16,
    effects: [{ type: "damage", value: 16 }]
  },
  {
    id: "ultimate_dragon",
    name: "降龙绝式",
    input: ["left", "down", "right", "up", "punch"],
    tags: ["punch", "ultimate"],
    baseDamage: 48,
    effects: [{ type: "damage", value: 48 }]
  }
];

const BASE_MOVE_IDS = ["swift_punch", "chain_punch", "flying_kick", "guard_palm"];

module.exports = {
  MOVES,
  BASE_MOVE_IDS
};
