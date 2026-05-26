const RUN_MAP = [
  {
    floor: 1,
    title: "初入江湖",
    nodes: [
      { type: "battle", enemy: "bandit", label: "山道伏击" },
      { type: "event", label: "破庙奇遇" },
      { type: "elite", enemy: "swordsman", label: "剑客试招" }
    ]
  },
  {
    floor: 2,
    title: "江湖纷争",
    nodes: [
      { type: "battle", enemy: "monk", label: "铜人阵" },
      { type: "shop", label: "行脚商" },
      { type: "battle", enemy: "assassin", label: "暗器来袭" },
      { type: "elite", enemy: "elite", label: "黑衣高手" }
    ]
  },
  {
    floor: 3,
    title: "决战之巅",
    nodes: [
      { type: "battle", enemy: "elite", label: "登顶之战" },
      { type: "rest", label: "山巅调息" },
      { type: "boss", enemy: "boss", label: "魔教护法" }
    ]
  }
];

module.exports = {
  RUN_MAP
};
