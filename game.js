const { WuxiaGame } = require("./src/app");

function createRuntimeCanvas() {
  if (typeof wx !== "undefined" && wx.createCanvas) {
    const canvas = wx.createCanvas();
    return {
      canvas,
      ctx: canvas.getContext("2d")
    };
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    return {
      canvas,
      ctx: canvas.getContext("2d")
    };
  }

  throw new Error("No canvas runtime available.");
}

const runtime = createRuntimeCanvas();
const game = new WuxiaGame(runtime.canvas, runtime.ctx);
game.start();
