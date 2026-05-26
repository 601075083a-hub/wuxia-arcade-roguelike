const BATTLE_ASSETS = {
  battleBackground: "assets/battle/png/background.png",
  player: "assets/battle/png/player.png",
  enemy: "assets/battle/png/enemy.png",
  cardDirection: "assets/battle/png/card-direction.png",
  cardPunch: "assets/battle/png/card-punch.png",
  cardKick: "assets/battle/png/card-kick.png",
  panel: "assets/battle/png/panel.png",
  controlBar: "assets/battle/png/control-bar.png"
};

class AssetLoader {
  constructor(canvas) {
    this.canvas = canvas;
    this.images = {};
    this.failed = {};
  }

  loadAll() {
    const tasks = Object.keys(BATTLE_ASSETS).map((key) => this.loadImage(key, BATTLE_ASSETS[key]));
    return Promise.all(tasks).then(() => this.images);
  }

  loadImage(key, src) {
    return new Promise((resolve) => {
      const image = this.createImage();
      if (!image) {
        this.failed[key] = true;
        resolve(null);
        return;
      }
      image.onload = () => {
        this.images[key] = image;
        resolve(image);
      };
      image.onerror = () => {
        this.failed[key] = true;
        resolve(null);
      };
      image.src = src;
    });
  }

  createImage() {
    if (this.canvas && this.canvas.createImage) return this.canvas.createImage();
    if (typeof wx !== "undefined" && wx.createImage) return wx.createImage();
    if (typeof Image !== "undefined") return new Image();
    return null;
  }

  get(key) {
    return this.images[key] || null;
  }
}

module.exports = {
  AssetLoader,
  BATTLE_ASSETS
};
