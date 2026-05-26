const { WuxiaGame } = require("../../src/app");

Page({
  data: {
    error: ""
  },

  onReady() {
    const query = this.createSelectorQuery();
    query
      .select("#gameCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        try {
          const canvasInfo = res && res[0];
          if (!canvasInfo || !canvasInfo.node) {
            this.setData({ error: "Canvas 初始化失败：未找到 gameCanvas 节点。" });
            return;
          }
          const canvas = canvasInfo.node;
          const ctx = canvas.getContext("2d");
          this.game = new WuxiaGame(canvas, ctx, {
            bindInput: false,
            viewport: {
              width: canvasInfo.width,
              height: canvasInfo.height
            }
          });
          this.game.start();
        } catch (error) {
          console.error(error);
          this.setData({ error: `启动失败：${error.message || error}` });
        }
      });
  },

  onTouchStart(event) {
    const touch = event.touches && event.touches[0];
    if (!this.game || !touch) return;
    this.game.handleTouch(touch.clientX, touch.clientY);
  }
});
