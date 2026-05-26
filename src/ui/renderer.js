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

function drawButton(ctx, box, label, enabled) {
  roundRect(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fillStyle = enabled === false ? "#463b31" : "#d7a849";
  ctx.fill();
  ctx.strokeStyle = "#f6df92";
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, label, box.x + box.w / 2, box.y + box.h / 2, 17, enabled === false ? "#9c8c7a" : "#22150d", "center");
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
      drawText(ctx, "武侠街机 Roguelike", DESIGN_WIDTH / 2, 164, 30, "#fff3c4", "center");
      drawText(ctx, "搓招组牌 · 江湖跑图 · 外功内功构建", DESIGN_WIDTH / 2, 208, 15, "#f7d98a", "center");
      drawText(ctx, "点击开始 Demo", DESIGN_WIDTH / 2, 420, 22, "#ffffff", "center");
      const box = { x: 95, y: 500, w: 200, h: 54 };
      drawButton(ctx, box, "开始闯荡", true);
      this.addHit(box, "startRun");
    },

    drawHud() {
      drawText(ctx, `气血 ${state.player.hp}/${state.player.maxHp}`, 18, 28, 15, "#fff3c4");
      drawText(ctx, `护甲 ${state.player.block}`, 18, 50, 14, "#dde8ff");
      drawText(ctx, `金 ${state.player.gold}`, DESIGN_WIDTH - 18, 28, 15, "#fbd36b", "right");
    },

    drawMap() {
      this.drawHud();
      const floor = RUN_MAP[state.run.floorIndex];
      drawText(ctx, floor.title, DESIGN_WIDTH / 2, 112, 26, "#fff3c4", "center");
      drawText(ctx, `第 ${floor.floor} 层`, DESIGN_WIDTH / 2, 145, 16, "#e2c778", "center");
      floor.nodes.forEach((node, index) => {
        const active = index === state.run.nodeIndex;
        const done = index < state.run.nodeIndex;
        const y = 220 + index * 110;
        roundRect(ctx, 68, y, 254, 70, 18);
        ctx.fillStyle = active ? "#5b351f" : done ? "#25321f" : "#2e2925";
        ctx.fill();
        ctx.strokeStyle = active ? "#f0c76b" : "#6d5a3c";
        ctx.lineWidth = 2;
        ctx.stroke();
        drawText(ctx, done ? "已完成" : node.label, DESIGN_WIDTH / 2, y + 27, 19, "#fff3c4", "center");
        drawText(ctx, node.type.toUpperCase(), DESIGN_WIDTH / 2, y + 51, 12, "#c8b68b", "center");
        if (active) this.addHit({ x: 68, y, w: 254, h: 70 }, "enterNode");
      });
    },

    drawBattle() {
      const battle = state.battle;
      const enemy = battle.enemy;
      this.drawBattleBackdrop();
      this.drawEnemy(enemy);
      this.drawPlayerBattleHud();
      this.drawFighters();
      this.drawComboPanel();
      this.drawHand();
      this.drawBottomBar();
    },

    drawBattleBackdrop() {
      if (assets && assets.get && assets.get("battleBackground")) {
        ctx.fillStyle = "rgba(22,12,8,0.18)";
        ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      }
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.ellipse(195, 388, 170, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,221,126,0.65)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(195, 432, 138, Math.PI * 0.1, Math.PI * 1.85);
      ctx.stroke();
    },

    drawEnemy(enemy) {
      roundRect(ctx, 22, 34, 346, 58, 18);
      ctx.fillStyle = "rgba(32,22,17,0.9)";
      ctx.fill();
      ctx.strokeStyle = "#a9773c";
      ctx.stroke();
      drawText(ctx, enemy.name, 56, 53, 16, "#fff3c4");
      ctx.fillStyle = "#3b1b13";
      ctx.fillRect(116, 50, 190, 16);
      ctx.fillStyle = "#e44f2f";
      ctx.fillRect(116, 50, Math.max(0, 190 * enemy.hp / enemy.maxHp), 16);
      drawText(ctx, `${enemy.hp}/${enemy.maxHp}`, 211, 58, 11, "#fff", "center");
      const intent = enemy.intents[enemy.intentIndex % enemy.intents.length];
      drawText(ctx, intent.label, 334, 61, 12, "#ffd36b", "right");
      if (enemy.block > 0) drawText(ctx, `盾 ${enemy.block}`, 334, 82, 12, "#bfe1ff", "right");
    },

    drawPlayerBattleHud() {
      roundRect(ctx, 25, 468, 238, 36, 12);
      ctx.fillStyle = "rgba(26,18,13,0.82)";
      ctx.fill();
      ctx.strokeStyle = "#8d6a37";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawText(ctx, "少侠", 47, 486, 13, "#fff3c4");
      ctx.fillStyle = "#3b1b13";
      ctx.fillRect(86, 479, 112, 12);
      ctx.fillStyle = "#e44f2f";
      ctx.fillRect(86, 479, Math.max(0, 112 * state.player.hp / state.player.maxHp), 12);
      drawText(ctx, `${state.player.hp}/${state.player.maxHp}`, 142, 485, 9, "#fff", "center");
      drawText(ctx, `甲 ${state.player.block}`, 224, 486, 12, "#bfe1ff", "center");
      if (state.player.poison > 0) drawText(ctx, `毒 ${state.player.poison}`, 251, 486, 12, "#b6e889", "center");
    },

    drawFighters() {
      if (this.drawAsset("enemy", 130, 134, 130, 170)) {
        this.drawAsset("player", 70, 300, 250, 330);
        return;
      }
      this.drawPaintedEnemy();
      this.drawPaintedPlayer();
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
      if (!this.drawAsset("panel", 22, 515, 346, 63)) {
        roundRect(ctx, 22, 515, 346, 58, 10);
        ctx.fillStyle = "rgba(31,20,12,0.92)";
        ctx.fill();
        ctx.strokeStyle = "#b07a3b";
        ctx.stroke();
      }
      const sequence = selected.map((card) => state.fragmentMap[card.id].label).join(" ");
      const title = move ? `${move.name}  ${sequence}` : sequence || "选择手牌碎片开始搓招";
      drawText(ctx, title, 195, 538, 20, move ? "#ffe79b" : "#cdbb93", "center");
      drawText(ctx, move ? `预计伤害 ${state.estimateDamage(move)}` : "命中配方后可出招", 195, 562, 13, "#d6c299", "center");
      selected.forEach((card, index) => {
        this.addHit({ x: 28 + index * 44, y: 518, w: 38, h: 50 }, "unselectCard", card.uid);
      });
      const castBox = { x: 286, y: 456, w: 76, h: 42 };
      drawButton(ctx, castBox, "出招", Boolean(move));
      this.addHit(castBox, "castMove");
    },

    drawHand() {
      const battle = state.battle;
      const cardW = 56;
      const gap = 7;
      const total = battle.hand.length * cardW + Math.max(0, battle.hand.length - 1) * gap;
      const startX = (DESIGN_WIDTH - total) / 2;
      battle.hand.forEach((card, index) => {
        const fragment = state.fragmentMap[card.id];
        const selected = battle.selected.includes(card);
        const x = startX + index * (cardW + gap);
        const y = selected ? 594 : 612;
        const cardAsset = fragment.type === "direction" ? "cardDirection" : card.id === "punch" ? "cardPunch" : "cardKick";
        if (!this.drawAsset(cardAsset, x, y, cardW, 112)) {
          roundRect(ctx, x, y, cardW, 112, 8);
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
          ctx.strokeStyle = selected ? "#fff3a0" : "#8d6a37";
          ctx.lineWidth = selected ? 4 : 2;
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 6, y + 6, cardW - 12, 100);
        } else if (selected) {
          roundRect(ctx, x, y, cardW, 112, 8);
          ctx.strokeStyle = "#fff3a0";
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        drawText(ctx, fragment.label, x + cardW / 2, y + 52, fragment.type === "attack" ? 28 : 36, "#1f1a12", "center");
        drawText(ctx, fragment.name, x + cardW / 2, y + 88, 12, "#3c2b1f", "center");
        this.addHit({ x, y, w: cardW, h: 112 }, "selectHandCard", card.uid);
      });
    },

    drawBottomBar() {
      const battle = state.battle;
      if (!this.drawAsset("controlBar", 0, 744, DESIGN_WIDTH, 110)) {
        roundRect(ctx, 0, 744, DESIGN_WIDTH, 100, 0);
        ctx.fillStyle = "rgba(28,18,12,0.96)";
        ctx.fill();
      }
      drawText(ctx, "内功", 34, 774, 13, "#ccb47f", "center");
      state.player.internals.slice(0, 2).forEach((id, index) => {
        const internal = state.internalMap[id];
        drawText(ctx, internal.name.slice(0, 3), 54 + index * 64, 814, 12, "#fff3c4", "center");
      });
      roundRect(ctx, 146, 764, 82, 32, 12);
      ctx.fillStyle = "#2a1d14";
      ctx.fill();
      ctx.strokeStyle = "#b88945";
      ctx.stroke();
      drawText(ctx, `出招 ${battle.actionsLeft}/3`, 187, 780, 14, "#ffd45e", "center");
      const clearBox = { x: 246, y: 758, w: 52, h: 38 };
      const endBox = { x: 306, y: 758, w: 66, h: 38 };
      drawButton(ctx, clearBox, "清空", true);
      drawButton(ctx, endBox, "回合", true);
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
        drawText(ctx, option.title, DESIGN_WIDTH / 2, box.y + 34, 19, "#ffe79b", "center");
        drawText(ctx, "点击选择", DESIGN_WIDTH / 2, box.y + 62, 13, "#c8b68b", "center");
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
      roundRect(ctx, 18, 92, 354, 34, 12);
      ctx.fillStyle = "rgba(26,18,13,0.68)";
      ctx.fill();
      drawText(ctx, state.message, DESIGN_WIDTH / 2, 109, 13, "#f5ddb0", "center");
    }
  };

  return renderer;
}

module.exports = {
  makeRenderer,
  DESIGN_WIDTH,
  DESIGN_HEIGHT
};
