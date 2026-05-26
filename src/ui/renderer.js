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

function makeRenderer(canvas, ctx, state) {
  const renderer = {
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    hits: [],

    resize() {
      const info = typeof wx !== "undefined" && wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: DESIGN_WIDTH, windowHeight: DESIGN_HEIGHT, pixelRatio: 1 };
      const dpr = info.pixelRatio || 1;
      canvas.width = info.windowWidth * dpr;
      canvas.height = info.windowHeight * dpr;
      canvas.style && (canvas.style.width = `${info.windowWidth}px`);
      canvas.style && (canvas.style.height = `${info.windowHeight}px`);
      this.scale = Math.min(info.windowWidth / DESIGN_WIDTH, info.windowHeight / DESIGN_HEIGHT);
      this.offsetX = (info.windowWidth - DESIGN_WIDTH * this.scale) / 2;
      this.offsetY = (info.windowHeight - DESIGN_HEIGHT * this.scale) / 2;
      ctx.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, dpr * this.offsetX, dpr * this.offsetY);
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
      const gradient = ctx.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
      gradient.addColorStop(0, "#d9e6ef");
      gradient.addColorStop(0.48, "#8fa18f");
      gradient.addColorStop(0.49, "#483323");
      gradient.addColorStop(1, "#1d1510");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
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
      ctx.fillStyle = "#211914";
      ctx.beginPath();
      ctx.arc(195, 220, 32, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, "敌", 195, 220, 28, "#f0c76b", "center");
      ctx.fillStyle = "#d29a32";
      ctx.beginPath();
      ctx.arc(195, 438, 44, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, "侠", 195, 438, 34, "#1b120d", "center");
    },

    drawComboPanel() {
      const battle = state.battle;
      const selected = battle.selected;
      const move = state.getCurrentMove();
      roundRect(ctx, 22, 515, 346, 58, 10);
      ctx.fillStyle = "rgba(31,20,12,0.92)";
      ctx.fill();
      ctx.strokeStyle = "#b07a3b";
      ctx.stroke();
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
        roundRect(ctx, x, y, cardW, 112, 8);
        ctx.fillStyle = fragment.color;
        ctx.fill();
        ctx.strokeStyle = selected ? "#fff3a0" : "#8d6a37";
        ctx.lineWidth = selected ? 4 : 2;
        ctx.stroke();
        drawText(ctx, fragment.label, x + cardW / 2, y + 52, fragment.type === "attack" ? 28 : 36, "#1f1a12", "center");
        drawText(ctx, fragment.name, x + cardW / 2, y + 88, 12, "#3c2b1f", "center");
        this.addHit({ x, y, w: cardW, h: 112 }, "selectHandCard", card.uid);
      });
    },

    drawBottomBar() {
      const battle = state.battle;
      roundRect(ctx, 0, 744, DESIGN_WIDTH, 100, 0);
      ctx.fillStyle = "rgba(28,18,12,0.96)";
      ctx.fill();
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
