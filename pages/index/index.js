const { WuxiaGame } = require("../../src/app");

Page({
  data: {},

  onReady() {
    const query = wx.createSelectorQuery();
    query
      .select("#gameCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvasInfo = res && res[0];
        if (!canvasInfo || !canvasInfo.node) {
          console.error("Canvas node not found.");
          return;
        }
        const canvas = canvasInfo.node;
        const ctx = canvas.getContext("2d");
        this.game = new WuxiaGame(canvas, ctx, { bindInput: false });
        this.game.start();
      });
  },

  onTouchStart(event) {
    const touch = event.touches && event.touches[0];
    if (!this.game || !touch) return;
    this.game.handleTouch(touch.clientX, touch.clientY);
  }
});
