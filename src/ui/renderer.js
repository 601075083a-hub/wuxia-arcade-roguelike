const { RUN_MAP } = require("../../data/map");

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawText(ctx, text, x, y, size, color, align) {
  ctx.font = `${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align || "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function fitText(ctx, text, size, maxWidth) {
  ctx.font = `${size}px sans-serif`;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}...`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}...`;
}

function drawOutlinedText(ctx, text, x, y, size, color, stroke, align) {
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = align || "left";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, Math.round(size * 0.12));
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawButton(ctx, box, label, enabled) {
  roundRect(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fillStyle = enabled === false ? "#463b31" : "#d7a849";
  ctx.fill();
  ctx.strokeStyle = "#f6df92";
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, label, box.x + box.w / 2, box.y + box.h / 2, 17, enabled === false ? "#9c8c7a" : "#22150d", "center");
}

function drawHudPlaque(ctx, box, options) {
  const radius = options && options.radius !== undefined ? options.radius : 12;
  const fill = options && options.fill ? options.fill : "rgba(5, 15, 15, 0.78)";
  const stroke = options && options.stroke ? options.stroke : "rgba(218, 174, 92, 0.72)";
  roundRect(ctx, box.x, box.y, box.w, box.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = options && options.lineWidth ? options.lineWidth : 1.2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 226, 154, 0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x + 16, box.y + 6);
  ctx.lineTo(box.x + box.w - 16, box.y + 6);
  ctx.moveTo(box.x + 16, box.y + box.h - 6);
  ctx.lineTo(box.x + box.w - 16, box.y + box.h - 6);
  ctx.stroke();
}

function drawHudButton(ctx, box, label, enabled) {
  drawHudPlaque(ctx, box, {
    radius: 11,
    fill: enabled === false ? "rgba(45, 38, 31, 0.82)" : "rgba(35, 28, 22, 0.9)",
    stroke: enabled === false ? "rgba(154, 126, 82, 0.52)" : "rgba(245, 202, 107, 0.88)",
    lineWidth: enabled === false ? 1 : 1.5
  });
  drawText(ctx, label, box.x + box.w / 2, box.y + box.h / 2, box.h >= 48 ? 17 : 14, enabled === false ? "#9e927d" : "#ffe7a1", "center");
}

function drawBladePanel(ctx, box, fill) {
  const cut = Math.min(18, box.h * 0.4);
  ctx.beginPath();
  ctx.moveTo(box.x + cut, box.y);
  ctx.lineTo(box.x + box.w - cut, box.y);
  ctx.lineTo(box.x + box.w, box.y + box.h / 2);
  ctx.lineTo(box.x + box.w - cut, box.y + box.h);
  ctx.lineTo(box.x + cut, box.y + box.h);
  ctx.lineTo(box.x, box.y + box.h / 2);
  ctx.closePath();
  ctx.fillStyle = fill || "rgba(3, 14, 14, 0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(232, 190, 96, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 231, 155, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x + cut + 10, box.y + 8);
  ctx.lineTo(box.x + box.w - cut - 10, box.y + 8);
  ctx.moveTo(box.x + cut + 10, box.y + box.h - 8);
  ctx.lineTo(box.x + box.w - cut - 10, box.y + box.h - 8);
  ctx.stroke();
}

function drawCommandSeal(ctx, box, label, enabled) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const r = Math.min(box.w, box.h) / 2 - 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = enabled === false ? "rgba(54, 45, 35, 0.86)" : "rgba(30, 25, 20, 0.94)";
  ctx.fill();
  ctx.strokeStyle = enabled === false ? "rgba(142, 116, 74, 0.55)" : "rgba(247, 205, 105, 0.95)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.strokeStyle = enabled === false ? "rgba(112, 95, 68, 0.45)" : "rgba(255, 235, 160, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  drawText(ctx, label, cx, cy, box.w >= 58 ? 16 : 13, enabled === false ? "#9e927d" : "#ffe7a1", "center");
  ctx.restore();
}

function drawComboTokenPanel(ctx, box) {
  const gradient = ctx.createLinearGradient(box.x, box.y, box.x, box.y + box.h);
  gradient.addColorStop(0, "rgba(6, 19, 19, 0.94)");
  gradient.addColorStop(0.55, "rgba(6, 14, 13, 0.9)");
  gradient.addColorStop(1, "rgba(17, 10, 7, 0.94)");
  drawBladePanel(ctx, box, gradient);
  ctx.fillStyle = "rgba(224, 178, 86, 0.12)";
  ctx.beginPath();
  ctx.arc(box.x + 32, box.y + box.h / 2, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 228, 148, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x + 70, box.y + 23);
  ctx.lineTo(box.x + box.w - 28, box.y + 23);
  ctx.moveTo(box.x + 70, box.y + box.h - 23);
  ctx.lineTo(box.x + box.w - 28, box.y + box.h - 23);
  ctx.stroke();
  drawText(ctx, "招", box.x + 32, box.y + box.h / 2, 22, "#ffe7a1", "center");
}

function drawHpGauge(ctx, x, y, w, h, value, maxValue) {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "rgba(35, 16, 13, 0.88)";
  ctx.fill();
  const fillW = Math.max(0, Math.min(w, w * value / Math.max(1, maxValue)));
  if (fillW > 0) {
    roundRect(ctx, x, y, fillW, h, h / 2);
    ctx.fillStyle = "#e85035";
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255, 218, 126, 0.36)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function makeRenderer(canvas, ctx, state, assets) {
  const renderer = {
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    hits: [],

    resize(viewport) {
      const sys = typeof wx !== "undefined" && wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: DESIGN_WIDTH, windowHeight: DESIGN_HEIGHT, pixelRatio: 1 };
      const info = {
        windowWidth: viewport && viewport.width ? viewport.width : sys.windowWidth,
        windowHeight: viewport && viewport.height ? viewport.height : sys.windowHeight,
        pixelRatio: sys.pixelRatio || 1
      };
      const dpr = info.pixelRatio || 1;
      canvas.width = info.windowWidth * dpr;
      canvas.height = info.windowHeight * dpr;
      canvas.style && (canvas.style.width = `${info.windowWidth}px`);
      canvas.style && (canvas.style.height = `${info.windowHeight}px`);
      this.scale = Math.min(info.windowWidth / DESIGN_WIDTH, info.windowHeight / DESIGN_HEIGHT);
      this.offsetX = (info.windowWidth - DESIGN_WIDTH * this.scale) / 2;
      this.offsetY = (info.windowHeight - DESIGN_HEIGHT * this.scale) / 2;
      if (ctx.setTransform) {
        ctx.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, dpr * this.offsetX, dpr * this.offsetY);
      } else {
        ctx.scale(dpr * this.scale, dpr * this.scale);
        ctx.translate(this.offsetX / this.scale, this.offsetY / this.scale);
      }
    },

    toDesignPoint(x, y) {
      return {
        x: (x - this.offsetX) / this.scale,
        y: (y - this.offsetY) / this.scale
      };
    },

    addHit(box, action, payload) {
      this.hits.push({ ...box, action, payload });
    },

    hitTest(x, y) {
      const point = this.toDesignPoint(x, y);
      for (let i = this.hits.length - 1; i >= 0; i -= 1) {
        const hit = this.hits[i];
        if (point.x >= hit.x && point.x <= hit.x + hit.w && point.y >= hit.y && point.y <= hit.y + hit.h) {
          return hit;
        }
      }
      return null;
    },

    clear() {
      this.hits = [];
      ctx.clearRect(-this.offsetX / this.scale, -this.offsetY / this.scale, canvas.width / this.scale, canvas.height / this.scale);
      if (state.scene === "battle" && this.drawAsset("battleBackground", 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)) return;
      if (state.scene === "battle") {
        this.drawPaintedBattleBackground();
        return;
      }
      const gradient = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
      gradient.addColorStop(0, "#d9e6ef");
      gradient.addColorStop(0.48, "#8fa18f");
      gradient.addColorStop(0.49, "#483323");
      gradient.addColorStop(1, "#1d1510");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    },

    drawPaintedBattleBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
      sky.addColorStop(0, "#dcebf2");
      sky.addColorStop(0.36, "#a8bab0");
      sky.addColorStop(0.54, "#6c7e68");
      sky.addColorStop(0.55, "#4b3323");
      sky.addColorStop(1, "#1b100b");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

      const glow = ctx.createRadialGradient(106, 112, 12, 106, 112, 240);
      glow.addColorStop(0, "rgba(255,245,200,0.82)");
      glow.addColorStop(1, "rgba(255,245,200,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, DESIGN_WIDTH, 360);

      ctx.fillStyle = "rgba(69,83,78,0.45)";
      ctx.beginPath();
      ctx.moveTo(-40, 312);
      ctx.bezierCurveTo(60, 150, 132, 116, 186, 306);
      ctx.bezierCurveTo(252, 86, 322, 108, 430, 312);
      ctx.lineTo(430, 460);
      ctx.lineTo(-40, 460);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(49,69,61,0.35)";
      ctx.beginPath();
      ctx.moveTo(50, 354);
      ctx.bezierCurveTo(120, 288, 176, 276, 230, 354);
      ctx.bezierCurveTo(282, 246, 336, 274, 420, 354);
      ctx.lineTo(420, 472);
      ctx.lineTo(50, 472);
      ctx.closePath();
      ctx.fill();

      const stone = ctx.createLinearGradient(0, 324, 0, 520);
      stone.addColorStop(0, "#b5a98f");
      stone.addColorStop(1, "#4a3728");
      ctx.fillStyle = stone;
      ctx.beginPath();
      ctx.ellipse(195, 374, 164, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.ellipse(195, 360, 154, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(26,15,10,0.84)";
      ctx.fillRect(0, 386, DESIGN_WIDTH, 458);

      ctx.strokeStyle = "rgba(243,211,116,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(195, 410, 138, Math.PI * 0.08, Math.PI * 1.86);
      ctx.stroke();

      ctx.fillStyle = "rgba(242,188,85,0.72)";
      [[64, 198, -0.7], [324, 168, 0.8], [306, 310, 1.2]].forEach((leaf) => {
        ctx.save();
        ctx.translate(leaf[0], leaf[1]);
        ctx.rotate(leaf[2]);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    },

    drawAsset(key, x, y, w, h) {
      const image = assets && assets.get ? assets.get(key) : null;
      if (!image) return false;
      try {
        ctx.drawImage(image, x, y, w, h);
        return true;
      } catch (error) {
        return false;
      }
    },

    drawAssetContain(key, x, y, w, h) {
      const image = assets && assets.get ? assets.get(key) : null;
      if (!image) return false;
      const imageW = image.width || image.naturalWidth || w;
      const imageH = image.height || image.naturalHeight || h;
      if (!imageW || !imageH) return this.drawAsset(key, x, y, w, h);
      const scale = Math.min(w / imageW, h / imageH);
      const drawW = imageW * scale;
      const drawH = imageH * scale;
      const drawX = x + (w - drawW) / 2;
      const drawY = y + (h - drawH) / 2;
      try {
        ctx.drawImage(image, drawX, drawY, drawW, drawH);
        return true;
      } catch (error) {
        return false;
      }
    },

    drawAssetCover(key, x, y, w, h) {
      const image = assets && assets.get ? assets.get(key) : null;
      if (!image) return false;
      const imageW = image.width || image.naturalWidth || w;
      const imageH = image.height || image.naturalHeight || h;
      if (!imageW || !imageH) return this.drawAsset(key, x, y, w, h);
      const scale = Math.max(w / imageW, h / imageH);
      const drawW = imageW * scale;
      const drawH = imageH * scale;
      const drawX = x + (w - drawW) / 2;
      const drawY = y + (h - drawH) / 2;
      try {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.drawImage(image, drawX, drawY, drawW, drawH);
        ctx.restore();
        return true;
      } catch (error) {
        ctx.restore && ctx.restore();
        return false;
      }
    },

    drawJianghuBackdrop(depth) {
      if (!this.drawAssetCover("battleBackground", 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)) {
        this.drawPaintedBattleBackground();
      }
      const shade = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
      shade.addColorStop(0, `rgba(7, 12, 13, ${depth === "title" ? 0.34 : 0.5})`);
      shade.addColorStop(0.36, "rgba(12, 18, 17, 0.44)");
      shade.addColorStop(0.74, "rgba(19, 11, 7, 0.76)");
      shade.addColorStop(1, "rgba(13, 7, 5, 0.94)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      ctx.strokeStyle = "rgba(230, 184, 95, 0.28)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.arc(195, 150 + i * 104, 72 + i * 18, Math.PI * 0.08, Math.PI * 0.92);
        ctx.stroke();
      }
    },

    render() {
      this.clear();
      if (state.scene === "title") this.drawTitle();
      if (state.scene === "map") this.drawMap();
      if (state.scene === "battle") this.drawBattle();
      if (state.scene === "reward") this.drawChoiceScreen("战利品", state.reward || [], "chooseReward");
      if (state.scene === "shop") this.drawShop();
      if (state.scene === "event") this.drawEvent();
      if (state.scene === "rest") this.drawRest();
      if (state.scene === "result") this.drawResult();
      this.drawMessage();
    },

    drawTitle() {
      this.drawJianghuBackdrop("title");
      ctx.fillStyle = "rgba(18, 12, 8, 0.58)";
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      ctx.strokeStyle = "rgba(234, 190, 100, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 126);
      ctx.lineTo(320, 126);
      ctx.moveTo(92, 298);
      ctx.lineTo(298, 298);
      ctx.stroke();

      drawText(ctx, "武侠街机", DESIGN_WIDTH / 2, 168, 42, "#fff1b8", "center");
      drawText(ctx, "ROGUELIKE", DESIGN_WIDTH / 2, 216, 22, "#d6a64f", "center");
      drawText(ctx, "拳腿碎片，搓招入局", DESIGN_WIDTH / 2, 264, 15, "#e7d1a2", "center");

      roundRect(ctx, 60, 352, 270, 86, 18);
      ctx.fillStyle = "rgba(22, 15, 10, 0.76)";
      ctx.fill();
      ctx.strokeStyle = "rgba(216, 168, 73, 0.72)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawText(ctx, "完整 Demo", DESIGN_WIDTH / 2, 380, 17, "#ffe79b", "center");
      drawText(ctx, "跑图  战斗  奖励  Boss", DESIGN_WIDTH / 2, 412, 13, "#cbb78a", "center");

      const box = { x: 88, y: 518, w: 214, h: 58 };
      drawButton(ctx, box, "开始闯荡", true);
      drawText(ctx, "点击后进入江湖路线", DESIGN_WIDTH / 2, 606, 13, "#bda77d", "center");
      this.addHit(box, "startRun");
    },

    drawHud() {
      drawText(ctx, `气血 ${state.player.hp}/${state.player.maxHp}`, 18, 28, 15, "#fff3c4");
      drawText(ctx, `护甲 ${state.player.block}`, 18, 50, 14, "#dde8ff");
      drawText(ctx, `金 ${state.player.gold}`, DESIGN_WIDTH - 18, 28, 15, "#fbd36b", "right");
    },

    drawMap() {
      this.drawJianghuBackdrop("map");
      const floor = RUN_MAP[state.run.floorIndex];
      if (!floor) return;
      roundRect(ctx, 22, 38, 250, 58, 18);
      ctx.fillStyle = "rgba(31, 22, 16, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(216, 168, 73, 0.76)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawText(ctx, `${state.player.name}  ${state.player.hp}/${state.player.maxHp}`, 44, 58, 14, "#fff3c4");
      drawText(ctx, `金 ${state.player.gold}  外功${state.player.externals.length}  内功${state.player.internals.length}`, 44, 82, 12, "#d8bd79");

      drawText(ctx, "江湖路引", DESIGN_WIDTH / 2, 126, 28, "#fff1b8", "center");
      drawText(ctx, `${floor.title} · 第 ${floor.floor} 层`, DESIGN_WIDTH / 2, 160, 15, "#d6a64f", "center");

      const nodeTypeLabel = {
        battle: "普通",
        elite: "精英",
        shop: "商店",
        event: "奇遇",
        rest: "调息",
        boss: "Boss"
      };
      const nodeXs = [126, 264, 126, 264, 126];
      const startY = 226;
      const gapY = floor.nodes.length >= 4 ? 104 : 122;
      ctx.strokeStyle = "rgba(214, 166, 79, 0.46)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      floor.nodes.forEach((node, index) => {
        const x = nodeXs[index % nodeXs.length];
        const y = startY + index * gapY;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      floor.nodes.forEach((node, index) => {
        const active = index === state.run.nodeIndex;
        const done = index < state.run.nodeIndex;
        const future = index > state.run.nodeIndex;
        const x = nodeXs[index % nodeXs.length];
        const y = startY + index * gapY;
        const box = { x: x - 82, y: y - 36, w: 164, h: 72 };
        roundRect(ctx, box.x, box.y, box.w, box.h, 16);
        ctx.fillStyle = active ? "rgba(92, 53, 31, 0.94)" : done ? "rgba(31, 48, 35, 0.82)" : "rgba(30, 27, 24, 0.72)";
        ctx.fill();
        ctx.strokeStyle = active ? "#f0c76b" : done ? "#74905e" : "#6d5a3c";
        ctx.lineWidth = active ? 2.5 : 1.5;
        ctx.stroke();
        roundRect(ctx, box.x + 14, box.y + 12, 42, 20, 9);
        ctx.fillStyle = active ? "rgba(238, 193, 96, 0.28)" : "rgba(148, 118, 69, 0.24)";
        ctx.fill();
        drawText(ctx, nodeTypeLabel[node.type] || node.type, box.x + 35, box.y + 22, 10, active ? "#ffe79b" : "#c8b68b", "center");
        drawText(ctx, done ? "已完成" : fitText(ctx, node.label, 17, 92), box.x + 68, box.y + 26, 17, future ? "#8d806b" : "#fff3c4");
        drawText(ctx, active ? "点击前往" : done ? "旧路已过" : "未到达", box.x + 68, box.y + 52, 12, active ? "#f0c76b" : "#9f8c6a");
        if (active) this.addHit(box, "enterNode");
      });

      roundRect(ctx, 48, 754, 294, 42, 14);
      ctx.fillStyle = "rgba(18, 12, 8, 0.74)";
      ctx.fill();
      ctx.strokeStyle = "rgba(184,137,69,0.58)";
      ctx.stroke();
      drawText(ctx, "选择当前节点，继续推进这一局", DESIGN_WIDTH / 2, 775, 13, "#d8bd79", "center");
    },

    drawBattle() {
      const battle = state.battle;
      const enemy = battle.enemy;
      this.drawBattleBackdrop();
      this.drawFighters();
      this.drawBattleFeedback();
      this.drawEnemyBattleHud(enemy);
      this.drawComboPanel();
      this.drawInternalTrigger();
      this.drawHand();
      this.drawBottomBar();
    },

    drawBattleBackdrop() {
      if (assets && assets.get && assets.get("battleBackground")) {
        ctx.fillStyle = "rgba(4,8,10,0.44)";
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      }
      const bottomShade = ctx.createLinearGradient(0, 250, 0, DESIGN_HEIGHT);
      bottomShade.addColorStop(0, "rgba(5,10,12,0)");
      bottomShade.addColorStop(0.68, "rgba(8,12,12,0.34)");
      bottomShade.addColorStop(1, "rgba(10,6,4,0.78)");
      ctx.fillStyle = bottomShade;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      ctx.fillStyle = "rgba(235,245,220,0.16)";
      ctx.beginPath();
      ctx.ellipse(195, 390, 144, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,221,126,0.58)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(195, 420, 126, Math.PI * 0.1, Math.PI * 1.85);
      ctx.stroke();
    },

    drawEnemyBattleHud(enemy) {
      drawBladePanel(ctx, { x: 24, y: 42, w: 246, h: 52 }, "rgba(2, 13, 15, 0.78)");
      ctx.fillStyle = "rgba(225, 180, 92, 0.16)";
      ctx.fillRect(54, 46, 1, 44);
      drawText(ctx, enemy.name, 42, 57, 14, "#fff0b8");
      drawHpGauge(ctx, 108, 52, 104, 8, enemy.hp, enemy.maxHp);
      drawText(ctx, `${enemy.hp}/${enemy.maxHp}`, 160, 56, 8, "#fff8d8", "center");
      const intent = enemy.intents[enemy.intentIndex % enemy.intents.length];
      drawText(ctx, intent.label, 42, 78, 12, "#f1c869");
      drawText(ctx, enemy.block > 0 ? `盾 ${enemy.block}` : "无盾", 216, 78, 12, "#cfe8ff", "right");
    },

    drawPlayerBottomHud() {
      drawBladePanel(ctx, { x: 16, y: 722, w: 218, h: 36 }, "rgba(2, 13, 15, 0.8)");
      drawText(ctx, "少侠", 36, 738, 12, "#fff0b8");
      drawHpGauge(ctx, 76, 733, 96, 9, state.player.hp, state.player.maxHp);
      drawText(ctx, `${state.player.hp}/${state.player.maxHp}`, 124, 737, 8, "#fff8d8", "center");
      drawText(ctx, `甲 ${state.player.block}`, 204, 738, 11, "#cfe8ff", "center");
      if (state.player.poison > 0) drawText(ctx, `毒 ${state.player.poison}`, 204, 750, 10, "#b6e889", "center");
    },

    drawFighters() {
      const enemyDrawn = this.drawAssetContain("enemy", 108, 122, 174, 200);
      const playerDrawn = this.drawAssetContain("player", 64, 282, 262, 300);
      if (!enemyDrawn) this.drawPaintedEnemy();
      if (!playerDrawn) this.drawPaintedPlayer();
    },

    drawBattleFeedback() {
      const battle = state.battle;
      if (!battle || !battle.flash) return;
      const alpha = Math.min(0.72, battle.flash / 14);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#ffe082";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(126, 234);
      ctx.quadraticCurveTo(190, 168, 266, 222);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 226, 128, 0.24)";
      ctx.beginPath();
      ctx.ellipse(195, 224, 82, 28, -0.18, 0, Math.PI * 2);
      ctx.fill();
      if (battle.lastDamage) {
        drawOutlinedText(ctx, `-${battle.lastDamage}`, 195, 172, 24, "#ffe082", "rgba(41,18,8,0.85)", "center");
      }
      ctx.restore();
      battle.flash = Math.max(0, battle.flash - 1);
    },

    drawInternalTrigger() {
      const battle = state.battle;
      if (!battle || !battle.internalTrigger || battle.internalTriggerTimer <= 0) return;
      const alpha = Math.min(1, battle.internalTriggerTimer / 24);
      ctx.save();
      ctx.globalAlpha = alpha;
      roundRect(ctx, 80, 438, 230, 28, 14);
      ctx.fillStyle = "rgba(24,17,12,0.86)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,216,120,0.9)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      drawText(ctx, battle.internalTrigger, 195, 452, 13, "#ffe79b", "center");
      ctx.restore();
      battle.internalTriggerTimer = Math.max(0, battle.internalTriggerTimer - 1);
    },

    drawPaintedEnemy() {
      ctx.save();
      ctx.translate(195, 216);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 72, 58, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#211713";
      ctx.beginPath();
      ctx.ellipse(0, -18, 24, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b87645";
      ctx.beginPath();
      ctx.ellipse(0, -8, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#241713";
      roundRect(ctx, -42, 18, 84, 82, 18);
      ctx.fill();
      ctx.strokeStyle = "#a96b32";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-38, 34);
      ctx.lineTo(42, 70);
      ctx.stroke();
      ctx.strokeStyle = "#1a1110";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(-36, 34);
      ctx.lineTo(-76, 70);
      ctx.moveTo(36, 34);
      ctx.lineTo(80, 70);
      ctx.stroke();
      ctx.restore();
    },

    drawPaintedPlayer() {
      ctx.save();
      ctx.translate(194, 438);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(4, 112, 116, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,216,98,0.78)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 4, 102, Math.PI * 0.15, Math.PI * 1.72);
      ctx.stroke();
      ctx.fillStyle = "#21130d";
      ctx.beginPath();
      ctx.ellipse(0, -76, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c98247";
      ctx.beginPath();
      ctx.ellipse(0, -56, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      const robe = ctx.createLinearGradient(-70, -10, 74, 86);
      robe.addColorStop(0, "#f1bd46");
      robe.addColorStop(1, "#7d3e19");
      ctx.fillStyle = robe;
      roundRect(ctx, -58, -30, 116, 116, 28);
      ctx.fill();
      ctx.strokeStyle = "#1b120d";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(-46, -12);
      ctx.lineTo(44, 44);
      ctx.stroke();
      ctx.strokeStyle = "#d3963d";
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(-52, -8);
      ctx.lineTo(-104, 52);
      ctx.moveTo(50, -8);
      ctx.lineTo(104, 42);
      ctx.stroke();
      ctx.strokeStyle = "#18100d";
      ctx.lineWidth = 28;
      ctx.beginPath();
      ctx.moveTo(-34, 78);
      ctx.lineTo(-88, 128);
      ctx.moveTo(34, 78);
      ctx.lineTo(86, 130);
      ctx.stroke();
      ctx.strokeStyle = "#7b2117";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(-56, 46);
      ctx.lineTo(62, 50);
      ctx.stroke();
      ctx.restore();
    },

    drawComboPanel() {
      const battle = state.battle;
      const selected = battle.selected;
      const move = state.getCurrentMove();
      const hints = state.getPlayableMoveHints ? state.getPlayableMoveHints() : [];
      const bestHint = hints[0] || null;
      const basicHint = !bestHint && state.getBasicHandFallbackHint ? state.getBasicHandFallbackHint() : null;
      const panel = { x: 46, y: 462, w: 244, h: 96 };
      drawComboTokenPanel(ctx, panel);
      const sequence = selected.map((card) => state.fragmentMap[card.id].label).join(" ");
      const hintSequence = bestHint ? bestHint.input.map((id) => state.fragmentMap[id].label).join(" ") : "";
      const title = move ? move.name : selected.length > 0 ? "已选碎片" : bestHint ? `可组成：${bestHint.name}` : basicHint ? `可普通出招：${basicHint.name}` : "选择手牌碎片开始搓招";
      const titleColor = move && !move.fallback ? "#fff0a8" : move ? "#ffe0a0" : bestHint ? "#ffe082" : "#cdbb93";
      drawText(ctx, fitText(ctx, state.message || "", 11, 148), 182, 480, 11, "#d7c097", "center");
      drawText(ctx, fitText(ctx, title, 18, 152), 182, 509, 18, titleColor, "center");
      if (selected.length > 0) {
        const tokenW = 28;
        const tokenGap = 6;
        const total = selected.length * tokenW + Math.max(0, selected.length - 1) * tokenGap;
        const startX = 182 - total / 2;
        selected.forEach((card, index) => {
          const tokenX = startX + index * (tokenW + tokenGap);
          const tokenY = 521;
          roundRect(ctx, tokenX, tokenY, tokenW, 24, 8);
          ctx.fillStyle = "rgba(218,174,92,0.18)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,226,154,0.78)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          drawText(ctx, state.fragmentMap[card.id].label, tokenX + tokenW / 2, tokenY + 12, 15, "#ffe8a4", "center");
          this.addHit({ x: tokenX, y: tokenY, w: tokenW, h: 24 }, "unselectCard", card.uid);
        });
      } else if (bestHint) {
        drawText(ctx, hintSequence, 182, 532, 14, "#f8d979", "center");
      } else if (basicHint) {
        drawText(ctx, "选中拳/腿即可出招", 182, 532, 13, "#d6c299", "center");
      } else {
        drawText(ctx, "点击手牌组成序列", 182, 532, 13, "#d6c299", "center");
      }
      const detail = move ? `${move.fallback ? "普通出招" : "正式招式"} · 预计伤害 ${state.estimateDamage(move)}` : selected.length > 0 ? sequence : bestHint ? `预计伤害 ${bestHint.damage}` : basicHint ? `预计伤害 ${basicHint.damage}` : "命中配方后可出招";
      drawText(ctx, fitText(ctx, detail, 12, 156), 182, 548, 12, "#d6c299", "center");
      const castBox = { x: 304, y: 478, w: 72, h: 72 };
      drawCommandSeal(ctx, castBox, "出招", Boolean(move));
      if (move) this.addHit(castBox, "castMove");
    },

    drawHand() {
      const battle = state.battle;
      const hintUids = new Set();
      if (state.getPlayableMoveHints) {
        state.getPlayableMoveHints().forEach((hint) => {
          hint.cardUids.forEach((uid) => hintUids.add(uid));
        });
      }
      const tray = { x: 16, y: 584, w: 358, h: 130 };
      drawHudPlaque(ctx, tray, { radius: 12, fill: "rgba(4, 13, 13, 0.46)", stroke: "rgba(206, 164, 86, 0.52)", lineWidth: 1 });
      ctx.strokeStyle = "rgba(245, 202, 107, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tray.x + 22, tray.y + 18);
      ctx.lineTo(tray.x + tray.w - 22, tray.y + 18);
      ctx.stroke();
      const handSize = battle.hand.length;
      const cardW = handSize > 6 ? 46 : handSize > 5 ? 52 : 58;
      const cardH = Math.round(cardW * 1.25);
      const gap = handSize > 6 ? 5 : handSize > 5 ? 7 : 8;
      const total = battle.hand.length * cardW + Math.max(0, battle.hand.length - 1) * gap;
      const startX = (DESIGN_WIDTH - total) / 2;
      battle.hand.forEach((card, index) => {
        const fragment = state.fragmentMap[card.id];
        const selected = battle.selected.includes(card);
        const hinted = hintUids.has(card.uid);
        const x = startX + index * (cardW + gap);
        const y = selected ? 598 : hinted ? 606 : 612;
        const cardAsset = fragment.type === "direction" ? "cardDirection" : card.id === "punch" ? "cardPunch" : "cardKick";
        if (hinted && !selected) {
          roundRect(ctx, x - 4, y - 4, cardW + 8, cardH + 8, 11);
          ctx.fillStyle = "rgba(255,218,91,0.16)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,224,130,0.86)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (!this.drawAssetContain(cardAsset, x, y, cardW, cardH)) {
          roundRect(ctx, x, y, cardW, cardH, 8);
          const cardGradient = ctx.createLinearGradient(x, y, x, y + 112);
          if (fragment.type === "direction") {
            cardGradient.addColorStop(0, "#f6f8c8");
            cardGradient.addColorStop(1, "#d6e89c");
          } else if (card.id === "punch") {
            cardGradient.addColorStop(0, "#ffe6a0");
            cardGradient.addColorStop(1, "#d29a38");
          } else {
            cardGradient.addColorStop(0, "#bdeaf0");
            cardGradient.addColorStop(1, "#5e9fb4");
          }
          ctx.fillStyle = cardGradient;
          ctx.fill();
          ctx.strokeStyle = selected ? "#fff3a0" : hinted ? "#ffe082" : "#8d6a37";
          ctx.lineWidth = selected ? 4 : hinted ? 3 : 2;
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 6, y + 6, cardW - 12, cardH - 12);
        } else if (selected || hinted) {
          roundRect(ctx, x, y, cardW, cardH, 8);
          ctx.strokeStyle = selected ? "#fff3a0" : "#ffe082";
          ctx.lineWidth = selected ? 4 : 3;
          ctx.stroke();
        }
        drawOutlinedText(ctx, fragment.label, x + cardW / 2, y + cardH * 0.43, fragment.type === "attack" ? 24 : 28, "#21150d", "rgba(255,246,204,0.88)", "center");
        drawOutlinedText(ctx, fragment.name, x + cardW / 2, y + cardH * 0.74, 10, "#2c2118", "rgba(255,246,204,0.78)", "center");
        this.addHit({ x, y, w: cardW, h: cardH }, "selectHandCard", card.uid);
      });
    },

    drawBottomBar() {
      const battle = state.battle;
      const bottomGradient = ctx.createLinearGradient(0, 708, 0, DESIGN_HEIGHT);
      bottomGradient.addColorStop(0, "rgba(2, 9, 9, 0.12)");
      bottomGradient.addColorStop(0.18, "rgba(2, 9, 9, 0.78)");
      bottomGradient.addColorStop(1, "rgba(4, 8, 8, 0.97)");
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, 706, DESIGN_WIDTH, 138);
      this.drawAssetContain("controlBar", 0, 744, DESIGN_WIDTH, 84);
      ctx.fillStyle = "rgba(0, 8, 8, 0.44)";
      ctx.fillRect(0, 706, DESIGN_WIDTH, 138);
      ctx.strokeStyle = "rgba(225, 180, 92, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(18, 722);
      ctx.lineTo(372, 722);
      ctx.stroke();
      this.drawPlayerBottomHud();
      drawText(ctx, "内功", 38, 772, 12, "#d8c08a", "center");
      state.getPlayerInternals().slice(0, 2).forEach((internal, index) => {
        const x = 18 + index * 66;
        drawHudPlaque(ctx, { x, y: 786, w: 62, h: 34 }, { radius: 8, fill: "rgba(6, 18, 18, 0.64)", stroke: "rgba(184, 137, 69, 0.54)", lineWidth: 1 });
        drawText(ctx, internal.shortName || internal.name.slice(0, 2), x + 31, 794, 12, "#fff3c4", "center");
        drawText(ctx, internal.combatText || "", x + 31, 809, 9, "#ccb47f", "center");
      });
      drawBladePanel(ctx, { x: 150, y: 768, w: 78, h: 30 }, "rgba(7, 17, 17, 0.8)");
      drawText(ctx, `出招 ${battle.actionsLeft}/3`, 189, 783, 13, "#ffd45e", "center");
      const clearBox = { x: 244, y: 756, w: 50, h: 50 };
      const endBox = { x: 312, y: 752, w: 58, h: 58 };
      drawCommandSeal(ctx, clearBox, "清空", true);
      drawCommandSeal(ctx, endBox, "回合", true);
      this.addHit(clearBox, "clearSelection");
      this.addHit(endBox, "endTurn");
    },

    drawChoiceScreen(title, options, action) {
      this.drawHud();
      drawText(ctx, title, DESIGN_WIDTH / 2, 112, 28, "#fff3c4", "center");
      options.forEach((option, index) => {
        const box = { x: 38, y: 190 + index * 126, w: 314, h: 92 };
        roundRect(ctx, box.x, box.y, box.w, box.h, 14);
        ctx.fillStyle = "#2d2119";
        ctx.fill();
        ctx.strokeStyle = "#b88945";
        ctx.stroke();
        if (option.tag) {
          roundRect(ctx, box.x + 18, box.y + 14, 72, 20, 9);
          ctx.fillStyle = option.type === "internal" ? "rgba(79,114,145,0.5)" : "rgba(184,137,69,0.38)";
          ctx.fill();
          drawText(ctx, option.tag, box.x + 54, box.y + 24, 10, "#fff3c4", "center");
        }
        drawText(ctx, fitText(ctx, option.title, 17, 194), box.x + 104, box.y + 25, 17, "#ffe79b");
        drawText(ctx, fitText(ctx, option.description || "点击选择", 12, 274), box.x + 20, box.y + 54, 12, "#e1cfa4");
        drawText(ctx, fitText(ctx, option.effect || "点击选择", 12, 274), box.x + 20, box.y + 76, 12, "#f3d56f");
        this.addHit(box, action, index);
      });
    },

    drawShop() {
      this.drawHud();
      drawText(ctx, "行脚商", DESIGN_WIDTH / 2, 112, 28, "#fff3c4", "center");
      const options = [
        ["买碎片 12金", "shopBuy", "fragment"],
        ["买外功 28金", "shopBuy", "external"],
        ["疗伤 16金", "shopBuy", "heal"],
        ["离开", "advanceNode", null]
      ];
      options.forEach((item, index) => {
        const box = { x: 82, y: 190 + index * 86, w: 226, h: 54 };
        drawButton(ctx, box, item[0], true);
        this.addHit(box, item[1], item[2]);
      });
    },

    drawEvent() {
      this.drawHud();
      drawText(ctx, "破庙奇遇", DESIGN_WIDTH / 2, 112, 28, "#fff3c4", "center");
      drawText(ctx, "残页泛着微光，似有心法藏于其中。", DESIGN_WIDTH / 2, 174, 15, "#e8d5a4", "center");
      const study = { x: 62, y: 260, w: 266, h: 58 };
      const gold = { x: 62, y: 342, w: 266, h: 58 };
      drawButton(ctx, study, "参悟残页（-10气血）", true);
      drawButton(ctx, gold, "取走盘缠（+22金）", true);
      this.addHit(study, "eventChoice", "study");
      this.addHit(gold, "eventChoice", "gold");
    },

    drawRest() {
      this.drawHud();
      drawText(ctx, "山巅调息", DESIGN_WIDTH / 2, 112, 28, "#fff3c4", "center");
      const heal = { x: 62, y: 260, w: 266, h: 58 };
      const maxHp = { x: 62, y: 342, w: 266, h: 58 };
      drawButton(ctx, heal, "恢复 35 气血", true);
      drawButton(ctx, maxHp, "根骨 +8", true);
      this.addHit(heal, "restChoice", "heal");
      this.addHit(maxHp, "restChoice", "maxHp");
    },

    drawResult() {
      drawText(ctx, state.player.hp > 0 ? "江湖留名" : "败走江湖", DESIGN_WIDTH / 2, 196, 32, "#fff3c4", "center");
      drawText(ctx, state.message, DESIGN_WIDTH / 2, 250, 16, "#e8d5a4", "center");
      drawText(ctx, `击败敌人：${state.player.defeated}`, DESIGN_WIDTH / 2, 312, 16, "#ffffff", "center");
      drawText(ctx, `外功：${state.player.externals.length}  内功：${state.player.internals.length}`, DESIGN_WIDTH / 2, 342, 16, "#ffffff", "center");
      const box = { x: 95, y: 430, w: 200, h: 54 };
      drawButton(ctx, box, "重新开始", true);
      this.addHit(box, "restart");
    },

    drawMessage() {
      const battleMode = state.scene === "battle";
      if (battleMode) return;
      const box = battleMode ? { x: 32, y: 466, w: 232, h: 26 } : { x: 18, y: 92, w: 354, h: 34 };
      roundRect(ctx, box.x, box.y, box.w, box.h, 12);
      ctx.fillStyle = "rgba(26,18,13,0.68)";
      ctx.fill();
      drawText(ctx, state.message, box.x + box.w / 2, box.y + box.h / 2, battleMode ? 11 : 13, "#f5ddb0", "center");
    }
  };

  return renderer;
}

module.exports = {
  makeRenderer,
  DESIGN_WIDTH,
  DESIGN_HEIGHT
};
