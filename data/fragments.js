const FRAGMENTS = {
  up: { id: "up", label: "↑", name: "上", type: "direction", color: "#e6f2b8" },
  down: { id: "down", label: "↓", name: "下", type: "direction", color: "#e6f2b8" },
  left: { id: "left", label: "←", name: "左", type: "direction", color: "#e6f2b8" },
  right: { id: "right", label: "→", name: "右", type: "direction", color: "#e6f2b8" },
  punch: { id: "punch", label: "拳", name: "拳", type: "attack", color: "#f2d276" },
  kick: { id: "kick", label: "腿", name: "腿", type: "attack", color: "#8ec7d8" }
};

const STARTER_DECK = [
  "up",
  "up",
  "down",
  "down",
  "left",
  "right",
  "right",
  "punch",
  "punch",
  "punch",
  "kick",
  "kick"
];

module.exports = {
  FRAGMENTS,
  STARTER_DECK
};
