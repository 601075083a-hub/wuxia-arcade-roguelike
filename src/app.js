const { GameState } = require("./core/game-state");
const { AssetLoader } = require("./core/asset-loader");
const { makeRenderer } = require("./ui/renderer");

class WuxiaGame {
  constructor(canvas, ctx, options) {
    this.options = options || {};
    this.canvas = canvas;
    this.ctx = ctx;
    this.state = new GameState();
    this.assets = new AssetLoader(canvas);
    this.renderer = makeRenderer(canvas, ctx, this.state, this.assets);
    this.running = false;
    this.lastTime = 0;
    if (this.options.bindInput !== false) this.bindInput();
    this.renderer.resize(this.options.viewport);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.assets.loadAll().then(() => {
      this.renderer.render();
    });
    this.loop(0);
  }

  loop(time) {
    this.lastTime = time;
    this.renderer.render();
    const requestFrame = this.canvas && this.canvas.requestAnimationFrame
      ? this.canvas.requestAnimationFrame.bind(this.canvas)
      : typeof requestAnimationFrame !== "undefined"
        ? requestAnimationFrame
        : (callback) => setTimeout(() => callback(Date.now()), 1000 / 30);
    requestFrame((nextTime) => this.loop(nextTime));
  }

  bindInput() {
    if (typeof wx !== "undefined" && wx.onTouchStart) {
      wx.onTouchStart((event) => {
        const touch = event.touches && event.touches[0];
        if (touch) this.handleTouch(touch.clientX, touch.clientY);
      });
    } else if (this.canvas && this.canvas.addEventListener) {
      let lastPointerTime = 0;
      const handleCanvasEvent = (event) => {
        if (event.type === "click" && Date.now() - lastPointerTime < 350) return;
        if (event.type === "pointerdown" || event.type === "touchstart") lastPointerTime = Date.now();
        const source = event.touches && event.touches[0] ? event.touches[0] : event;
        const rect = this.canvas.getBoundingClientRect ? this.canvas.getBoundingClientRect() : { left: 0, top: 0 };
        this.handleTouch(source.clientX - rect.left, source.clientY - rect.top);
        if (event.cancelable) event.preventDefault();
      };
      this.canvas.addEventListener("pointerdown", handleCanvasEvent);
      this.canvas.addEventListener("touchstart", handleCanvasEvent, { passive: false });
      this.canvas.addEventListener("click", handleCanvasEvent);
    }
  }

  handleTouch(x, y) {
    const hit = this.renderer.hitTest(x, y);
    if (!hit) return;
    this.dispatch(hit.action, hit.payload);
    this.renderer.render();
  }

  dispatch(action, payload) {
    if (action === "startRun") this.state.startRun();
    if (action === "restart") {
      this.state.resetRun();
      this.state.startRun();
    }
    if (action === "enterNode") this.state.enterCurrentNode();
    if (action === "advanceNode") this.state.advanceNode();
    if (action === "selectHandCard") this.state.selectHandCard(payload);
    if (action === "unselectCard") this.state.unselectCard(payload);
    if (action === "clearSelection") this.state.clearSelection();
    if (action === "castMove") this.state.castMove();
    if (action === "endTurn") this.state.endTurn();
    if (action === "chooseReward") this.state.chooseReward(payload);
    if (action === "shopBuy") this.state.buyShop(payload);
    if (action === "eventChoice") this.state.chooseEvent(payload);
    if (action === "restChoice") this.state.chooseRest(payload);
  }
}

module.exports = {
  WuxiaGame
};
