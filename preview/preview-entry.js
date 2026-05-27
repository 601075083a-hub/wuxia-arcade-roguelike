const { WuxiaGame } = require("../src/app");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const rect = canvas.getBoundingClientRect();

const game = new WuxiaGame(canvas, ctx, {
  viewport: {
    width: rect.width,
    height: rect.height
  }
});

window.__wuxiaPreviewGame = game;
game.start();
