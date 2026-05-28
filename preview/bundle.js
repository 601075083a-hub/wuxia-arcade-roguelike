(function(modules) {
  var cache = {};
  function localRequire(id) {
    if (cache[id]) return cache[id].exports;
    if (!modules[id]) throw new Error("Cannot find module " + id);
    var module = { exports: {} };
    cache[id] = module;
    var deps = modules[id][1];
    function require(request) {
      return localRequire(deps[request] || request);
    }
    modules[id][0](require, module, module.exports);
    return module.exports;
  }
  localRequire("preview/preview-entry.js");
})({
"preview/preview-entry.js": [function(require, module, exports) {
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
window.render_game_to_text = () => {
  const state = game.state;
  const battle = state.battle;
  const move = battle ? state.getCurrentMove() : null;
  const playableMoves = battle && state.getPlayableMoveHints ? state.getPlayableMoveHints() : [];
  const basicPlayableMove = battle && state.getBasicHandFallbackHint ? state.getBasicHandFallbackHint() : null;
  const enemy = battle && battle.enemy ? battle.enemy : null;
  const payload = {
    coordinateSystem: "design canvas 390x844, origin top-left, x right, y down",
    scene: state.scene,
    message: state.message,
    player: {
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      block: state.player.block,
      gold: state.player.gold,
      poison: state.player.poison,
      externals: state.player.externals,
      internals: state.getPlayerInternals ? state.getPlayerInternals().map((internal) => ({
        id: internal.id,
        name: internal.name,
        shortName: internal.shortName,
        description: internal.description,
        combatText: internal.combatText,
        ruleHooks: internal.ruleHooks
      })) : state.player.internals
    },
    run: {
      floorIndex: state.run.floorIndex,
      nodeIndex: state.run.nodeIndex,
      lastNode: state.run.lastNode ? state.run.lastNode.type : null
    },
    battle: battle ? {
      turn: battle.turn,
      actionsLeft: battle.actionsLeft,
      hand: battle.hand.map((card) => ({
        uid: card.uid,
        id: card.id,
        name: state.fragmentMap[card.id] ? state.fragmentMap[card.id].name : card.id,
        type: state.fragmentMap[card.id] ? state.fragmentMap[card.id].type : "unknown"
      })),
      selected: battle.selected.map((card) => ({
        uid: card.uid,
        id: card.id,
        name: state.fragmentMap[card.id] ? state.fragmentMap[card.id].name : card.id
      })),
      currentMove: move ? {
        id: move.id,
        name: move.name,
        damage: state.estimateDamage(move),
        fallback: Boolean(move.fallback),
        damageSummary: state.getDamageSummary ? state.getDamageSummary(move) : null
      } : null,
      playableMoves: playableMoves.map((hint) => ({
        id: hint.id,
        name: hint.name,
        input: hint.input,
        damage: hint.damage,
        cardUids: hint.cardUids
      })),
      basicPlayableMove: basicPlayableMove ? {
        id: basicPlayableMove.id,
        name: basicPlayableMove.name,
        input: basicPlayableMove.input,
        damage: basicPlayableMove.damage,
        cardUids: basicPlayableMove.cardUids
      } : null,
      internalTrigger: battle.internalTrigger,
      internalTriggerTimer: battle.internalTriggerTimer,
      lastDamageSummary: battle.damageSummary,
      enemy: enemy ? {
        id: enemy.id,
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        block: enemy.block,
        intent: enemy.intents[enemy.intentIndex % enemy.intents.length]
      } : null
    } : null,
    hits: game.renderer.hits.map((hit) => ({
      action: hit.action,
      payload: hit.payload,
      x: Math.round(hit.x),
      y: Math.round(hit.y),
      w: Math.round(hit.w),
      h: Math.round(hit.h)
    }))
  };
  return JSON.stringify(payload);
};
window.advanceTime = (ms) => {
  game.renderer.render();
  return window.render_game_to_text();
};

function formatPreviewState() {
  const payload = JSON.parse(window.render_game_to_text());
  return JSON.stringify(payload, null, 2);
}

function refreshDevPanel() {
  const output = document.getElementById("devState");
  if (!output) return;
  try {
    output.textContent = formatPreviewState();
  } catch (error) {
    output.textContent = `状态读取失败：${error.message}`;
  }
}

function dispatchPreviewAction(action) {
  if (action === "refresh") {
    refreshDevPanel();
    return;
  }
  if (action === "start") {
    game.dispatch("startRun");
  }
  if (action === "enter") {
    game.dispatch("enterNode");
  }
  if (action === "selectAttack") {
    const battle = game.state.battle;
    const attackCard = battle && battle.hand.find((card) => {
      const fragment = game.state.fragmentMap[card.id];
      return fragment && fragment.type === "attack";
    });
    if (attackCard) game.dispatch("selectHandCard", attackCard.uid);
  }
  if (action === "cast") {
    game.dispatch("castMove");
  }
  if (action === "endTurn") {
    game.dispatch("endTurn");
  }
  game.renderer.render();
  refreshDevPanel();
}

function selectBattleHudPreviewCards() {
  const battle = game.state.battle;
  if (!battle) return;

  if (!battle.hand.some((card) => {
    const fragment = game.state.fragmentMap[card.id];
    return fragment && fragment.type === "attack";
  })) {
    const attackIndex = battle.drawPile.findIndex((card) => {
      const fragment = game.state.fragmentMap[card.id];
      return fragment && fragment.type === "attack";
    });
    if (attackIndex >= 0) {
      battle.hand.push(battle.drawPile.splice(attackIndex, 1)[0]);
    }
  }

  const playable = game.state.getPlayableMoveHints ? game.state.getPlayableMoveHints()[0] : null;
  const cardUids = playable && playable.cardUids.length > 0
    ? playable.cardUids
    : battle.hand
      .filter((card) => {
        const fragment = game.state.fragmentMap[card.id];
        return fragment && fragment.type === "attack";
      })
      .slice(0, 1)
      .map((card) => card.uid);
  battle.selected = [];
  cardUids.forEach((uid) => game.state.selectHandCard(uid));
}

function applyPreviewMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") !== "battle-hud") return;
  game.dispatch("startRun");
  game.dispatch("enterNode");
  selectBattleHudPreviewCards();
  game.renderer.render();
}

document.querySelectorAll("[data-dev-action]").forEach((button) => {
  button.addEventListener("click", () => {
    dispatchPreviewAction(button.dataset.devAction);
  });
});

game.start();
applyPreviewMode();
setTimeout(refreshDevPanel, 0);

}, {"../src/app":"src/app.js"}],
"src/app.js": [function(require, module, exports) {
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

}, {"./core/game-state":"src/core/game-state.js","./core/asset-loader":"src/core/asset-loader.js","./ui/renderer":"src/ui/renderer.js"}],
"src/core/game-state.js": [function(require, module, exports) {
const { FRAGMENTS, STARTER_DECK } = require("../../data/fragments");
const { MOVES, BASE_MOVE_IDS } = require("../../data/moves");
const { EXTERNALS } = require("../../data/externals");
const { INTERNALS } = require("../../data/internals");
const { ENEMIES } = require("../../data/enemies");
const { RUN_MAP } = require("../../data/map");

const MAX_ACTIONS = 3;
const DRAW_COUNT = 5;
const HAND_LIMIT = 7;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function makeCards(ids) {
  return ids.map((id, index) => ({
    uid: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    id
  }));
}

function countIds(ids) {
  return ids.reduce((counts, id) => {
    counts[id] = (counts[id] || 0) + 1;
    return counts;
  }, {});
}

function sameIdCounts(a, b) {
  if (a.length !== b.length) return false;
  const left = countIds(a);
  const right = countIds(b);
  return Object.keys(left).every((id) => left[id] === right[id]);
}

function hasEnoughIds(availableIds, requiredIds) {
  const available = countIds(availableIds);
  const required = countIds(requiredIds);
  return Object.keys(required).every((id) => (available[id] || 0) >= required[id]);
}

class GameState {
  constructor() {
    this.fragmentMap = FRAGMENTS;
    this.moveMap = Object.fromEntries(MOVES.map((move) => [move.id, move]));
    this.externalMap = Object.fromEntries(EXTERNALS.map((item) => [item.id, item]));
    this.internalMap = Object.fromEntries(INTERNALS.map((item) => [item.id, item]));
    this.resetRun();
  }

  resetRun() {
    this.scene = "title";
    this.message = "点击开始，踏入江湖。";
    this.player = {
      name: "少侠",
      hp: 88,
      maxHp: 88,
      block: 0,
      gold: 20,
      poison: 0,
      deck: STARTER_DECK.slice(),
      externals: ["diamond_style"],
      internals: ["jiuyang"],
      defeated: 0
    };
    this.run = {
      floorIndex: 0,
      nodeIndex: 0,
      visited: [],
      lastNode: null
    };
    this.battle = null;
    this.reward = null;
  }

  startRun() {
    this.scene = "map";
    this.message = "选择下一个江湖节点。";
  }

  getCurrentFloor() {
    return RUN_MAP[this.run.floorIndex];
  }

  getCurrentNode() {
    const floor = this.getCurrentFloor();
    if (!floor) return null;
    return floor.nodes[this.run.nodeIndex] || null;
  }

  enterCurrentNode() {
    const node = this.getCurrentNode();
    if (!node) {
      this.scene = "result";
      this.message = "你已平定江湖。";
      return;
    }
    this.run.lastNode = node;
    if (node.enemy) {
      this.startBattle(node.enemy, node.type);
      return;
    }
    if (node.type === "shop") this.openShop();
    if (node.type === "event") this.openEvent();
    if (node.type === "rest") this.openRest();
  }

  advanceNode() {
    const floor = this.getCurrentFloor();
    this.run.visited.push({
      floor: this.run.floorIndex,
      node: this.run.nodeIndex
    });
    this.run.nodeIndex += 1;
    if (floor && this.run.nodeIndex >= floor.nodes.length) {
      this.run.floorIndex += 1;
      this.run.nodeIndex = 0;
    }
    if (!this.getCurrentFloor()) {
      this.scene = "result";
      this.message = "通关！你的搓招武学已名动江湖。";
    } else {
      this.scene = "map";
      this.message = "继续前进，选择下一处节点。";
    }
  }

  startBattle(enemyId, nodeType) {
    const enemy = clone(ENEMIES[enemyId]);
    enemy.hp = enemy.maxHp;
    enemy.intentIndex = 0;
    enemy.poison = 0;
    enemy.vulnerable = 0;

    let deckIds = this.player.deck.slice();
    let thinDeckRemoved = null;
    if (this.hasHook("thinDeck")) {
      const removeIndex = deckIds.findIndex((id) => FRAGMENTS[id].type === "direction");
      if (removeIndex >= 0) thinDeckRemoved = deckIds.splice(removeIndex, 1)[0];
    }

    this.battle = {
      nodeType,
      enemy,
      drawPile: shuffle(makeCards(deckIds)),
      discardPile: [],
      exhaustPile: [],
      hand: [],
      selected: [],
      actionsLeft: MAX_ACTIONS,
      turn: 1,
      firstMoveCast: false,
      extraDrawNextTurn: 0,
      log: ["战斗开始，抽取招式碎片。"],
      flash: 0,
      internalTrigger: null,
      internalTriggerTimer: 0,
      damageSummary: null
    };

    this.player.block = 0;
    this.drawCards(DRAW_COUNT);
    this.scene = "battle";
    if (thinDeckRemoved) {
      this.setInternalTrigger(`先天：临时移除${FRAGMENTS[thinDeckRemoved].name}`);
      this.message = `先天功生效，临时移除${FRAGMENTS[thinDeckRemoved].name}。`;
    } else {
      this.message = "点击手牌组成搓招序列。";
    }
  }

  hasHook(hook) {
    return this.player.internals.some((id) => {
      const internal = this.internalMap[id];
      return internal && internal.ruleHooks.includes(hook);
    });
  }

  getPlayerInternals() {
    return this.player.internals.map((id) => this.internalMap[id]).filter(Boolean);
  }

  setInternalTrigger(text) {
    if (!this.battle || !text) return;
    this.battle.internalTrigger = text;
    this.battle.internalTriggerTimer = 120;
  }

  getUnlockedMoves() {
    const unlocked = new Set(BASE_MOVE_IDS);
    this.player.externals.forEach((id) => {
      const external = this.externalMap[id];
      if (external) external.unlockedMoves.forEach((moveId) => unlocked.add(moveId));
    });
    return [...unlocked].map((id) => this.moveMap[id]).filter(Boolean);
  }

  drawCards(count) {
    if (!this.battle) return;
    const target = Math.min(HAND_LIMIT, this.battle.hand.length + count);
    while (this.battle.hand.length < target) {
      if (this.battle.drawPile.length === 0) {
        if (this.battle.discardPile.length === 0) break;
        this.battle.drawPile = shuffle(this.battle.discardPile);
        this.battle.discardPile = [];
      }
      const card = this.battle.drawPile.pop();
      if (card) this.battle.hand.push(card);
    }
  }

  getSelectedInput() {
    if (!this.battle) return [];
    return this.battle.selected.map((card) => card.id);
  }

  getCurrentMove() {
    const input = this.getSelectedInput();
    if (input.length === 0) return null;
    const matched = this.getUnlockedMoves().find((move) => sameIdCounts(move.input, input));
    if (matched) return matched;
    return this.getBasicFallbackMove(input);
  }

  getPlayableMoveHints() {
    if (!this.battle) return [];
    const handIds = this.battle.hand.map((card) => card.id);
    return this.getUnlockedMoves()
      .filter((move) => hasEnoughIds(handIds, move.input))
      .map((move) => ({
        id: move.id,
        name: move.name,
        input: move.input.slice(),
        damage: this.estimateDamage(move),
        cardUids: this.pickHintCardUids(move.input)
      }))
      .sort((a, b) => b.damage - a.damage);
  }

  getBasicHandFallbackHint() {
    if (!this.battle) return null;
    const attackCard = this.battle.hand.find((card) => card.id === "punch" || card.id === "kick");
    if (!attackCard) return null;
    const move = this.getBasicFallbackMove([attackCard.id]);
    if (!move) return null;
    return {
      id: move.id,
      name: move.name,
      input: move.input.slice(),
      damage: this.estimateDamage(move),
      cardUids: [attackCard.uid]
    };
  }

  pickHintCardUids(requiredIds) {
    if (!this.battle) return [];
    const required = countIds(requiredIds);
    const picked = [];
    this.battle.hand.forEach((card) => {
      if (required[card.id] > 0) {
        picked.push(card.uid);
        required[card.id] -= 1;
      }
    });
    return picked;
  }

  getBasicFallbackMove(input) {
    if (input.includes("punch")) {
      return {
        id: "basic_punch",
        name: "普通拳",
        input,
        tags: ["punch", "basic"],
        baseDamage: 5,
        effects: [{ type: "damage", value: 5 }],
        fallback: true
      };
    }
    if (input.includes("kick")) {
      return {
        id: "basic_kick",
        name: "普通腿",
        input,
        tags: ["kick", "basic"],
        baseDamage: 6,
        effects: [{ type: "damage", value: 6 }],
        fallback: true
      };
    }
    return null;
  }

  estimateDamage(move) {
    return this.getDamageSummary(move).totalDamage;
  }

  getDamageSummary(move) {
    if (!move) return { baseDamage: 0, totalDamage: 0, sources: [] };
    const sources = [];
    let baseDamage = move.baseDamage;
    if (this.hasHook("basicDamageBoost") && move.fallback) {
      baseDamage += 4;
      sources.push("无相 +4");
    }
    let multiplier = 1;
    this.player.externals.forEach((id) => {
      const external = this.externalMap[id];
      if (!external) return;
      external.passiveModifiers.forEach((modifier) => {
        if (modifier.damageMultiplier && move.tags.includes(modifier.tag)) {
          multiplier *= modifier.damageMultiplier;
          sources.push(`${external.name} x${modifier.damageMultiplier}`);
        }
      });
    });
    if (this.hasHook("formalDamageBoost") && !move.fallback) {
      multiplier *= 1.15;
      sources.push("易筋 +15%");
    }
    if (this.hasHook("handPower") && this.battle) {
      const handBonus = Math.min(0.3, this.battle.hand.length * 0.05);
      if (handBonus > 0) {
        multiplier *= 1 + handBonus;
        sources.push(`龙象 +${Math.round(handBonus * 100)}%`);
      }
    }
    if (this.battle && this.battle.enemy.vulnerable > 0) {
      multiplier *= 1.25;
      sources.push("易伤 x1.25");
    }
    return {
      baseDamage,
      totalDamage: Math.max(1, Math.round(baseDamage * multiplier)),
      sources
    };
  }

  selectHandCard(uid) {
    if (!this.battle || this.battle.selected.length >= 5) return;
    const card = this.battle.hand.find((item) => item.uid === uid);
    if (!card || this.battle.selected.includes(card)) return;
    this.battle.selected.push(card);
    const move = this.getCurrentMove();
    this.message = move ? `${move.name} 可出招，预计 ${this.estimateDamage(move)} 伤害。` : "只有方向无法出招，需要加入拳或腿。";
  }

  unselectCard(uid) {
    if (!this.battle) return;
    this.battle.selected = this.battle.selected.filter((card) => card.uid !== uid);
    this.message = "已撤回一个碎片。";
  }

  clearSelection() {
    if (!this.battle) return;
    this.battle.selected = [];
    this.message = "已清空搓招序列。";
  }

  castMove() {
    if (!this.battle || this.battle.actionsLeft <= 0) return;
    const move = this.getCurrentMove();
    if (!move) {
      this.message = "只有方向无法出招，需要加入拳或腿。";
      return;
    }

    const damageSummary = this.getDamageSummary(move);
    const damage = damageSummary.totalDamage;
    this.battle.damageSummary = damageSummary;
    this.damageEnemy(damage);
    this.battle.flash = 14;
    this.battle.lastDamage = damage;
    move.effects.forEach((effect) => {
      if (effect.type === "block") this.player.block += this.applyBonusBlock(move, effect.value);
      if (effect.type === "poison") this.battle.enemy.poison += effect.value;
      if (effect.type === "vulnerable") this.battle.enemy.vulnerable += effect.value;
      if (effect.type === "weaken") this.battle.enemy.vulnerable += effect.value;
    });

    this.battle.log.unshift(`${move.name} 命中，造成 ${damage} 伤害。`);
    this.consumeSelectedCards();

    const free = this.hasHook("freeFirstMove") && !this.battle.firstMoveCast;
    this.battle.firstMoveCast = true;
    if (!free) this.battle.actionsLeft -= 1;
    if (free) {
      this.setInternalTrigger("九阳：本次出招不耗次数");
    } else {
      const internalSources = damageSummary.sources.filter((source) => source.startsWith("无相") || source.startsWith("易筋") || source.startsWith("龙象"));
      if (internalSources.length > 0) this.setInternalTrigger(internalSources.join(" / "));
    }

    if (this.battle.enemy.hp <= 0) {
      this.finishBattle(true);
      return;
    }
    this.message = free ? "九阳神功生效，本次出招不消耗次数。" : "招式已结算。";
  }

  applyBonusBlock(move, value) {
    let bonus = value;
    this.player.externals.forEach((id) => {
      const external = this.externalMap[id];
      if (!external) return;
      external.passiveModifiers.forEach((modifier) => {
        if (modifier.bonusBlock && move.tags.includes(modifier.tag)) {
          bonus += modifier.bonusBlock;
        }
      });
    });
    return bonus;
  }

  damageEnemy(amount) {
    const enemy = this.battle.enemy;
    const blocked = Math.min(enemy.block, amount);
    enemy.block -= blocked;
    enemy.hp -= amount - blocked;
  }

  consumeSelectedCards() {
    const selectedIds = new Set(this.battle.selected.map((card) => card.uid));
    this.battle.hand = this.battle.hand.filter((card) => {
      if (selectedIds.has(card.uid)) {
        this.battle.discardPile.push(card);
        return false;
      }
      return true;
    });
    this.battle.selected = [];
  }

  endTurn() {
    if (!this.battle) return;
    const discarded = this.battle.hand.length + this.battle.selected.length;
    this.battle.discardPile.push(...this.battle.hand);
    this.battle.hand = [];
    this.battle.selected = [];

    this.resolveEnemyIntent();
    if (this.player.hp <= 0) {
      this.scene = "result";
      this.message = "落败。下一局可以尝试更精简的牌组。";
      return;
    }

    this.resolveStatusTick();
    if (this.battle.enemy.hp <= 0) {
      this.finishBattle(true);
      return;
    }

    const extra = this.hasHook("discardDraw") ? Math.min(2, Math.floor(discarded / 2)) : 0;
    this.player.block = 0;
    this.battle.turn += 1;
    this.battle.actionsLeft = MAX_ACTIONS;
    this.battle.firstMoveCast = false;
    this.drawCards(DRAW_COUNT + extra);
    if (extra > 0) this.setInternalTrigger(`北冥：额外抽 ${extra} 张`);
    this.battle.log.unshift(`第 ${this.battle.turn} 回合，抽取 ${DRAW_COUNT + extra} 张。`);
    this.message = extra > 0 ? `北冥神功生效，额外抽 ${extra} 张。` : "新回合开始。";
  }

  resolveEnemyIntent() {
    const enemy = this.battle.enemy;
    const intent = enemy.intents[enemy.intentIndex % enemy.intents.length];
    if (intent.type === "attack" || intent.type === "attackBlock") {
      const hits = intent.hits || 1;
      for (let i = 0; i < hits; i += 1) this.damagePlayer(intent.value);
      this.battle.log.unshift(`${enemy.name} 使用${intent.label}。`);
    }
    if (intent.type === "block" || intent.type === "attackBlock") {
      enemy.block += intent.block || intent.value;
      this.battle.log.unshift(`${enemy.name} 获得护甲。`);
    }
    if (intent.type === "debuff") {
      this.player.poison += intent.value;
      this.battle.log.unshift(`${enemy.name} 施加 ${intent.value} 层毒。`);
    }
    enemy.intentIndex += 1;
  }

  resolveStatusTick() {
    const enemy = this.battle.enemy;
    if (enemy.poison > 0) {
      enemy.hp -= enemy.poison;
      this.battle.log.unshift(`${enemy.name} 受到 ${enemy.poison} 点毒伤。`);
      enemy.poison = Math.max(0, enemy.poison - 1);
    }
    if (enemy.vulnerable > 0) enemy.vulnerable -= 1;
    if (this.player.poison > 0) {
      this.damagePlayer(this.player.poison);
      this.player.poison = Math.max(0, this.player.poison - 1);
    }
  }

  damagePlayer(amount) {
    const blocked = Math.min(this.player.block, amount);
    this.player.block -= blocked;
    this.player.hp -= amount - blocked;
  }

  finishBattle(victory) {
    if (!victory) {
      this.scene = "result";
      this.message = "落败。";
      return;
    }
    this.player.defeated += 1;
    this.player.gold += this.battle.enemy.rewards.gold || 0;
    if (this.battle.enemy.rewards.boss) {
      this.scene = "result";
      this.message = "胜利！你击败了魔教护法。";
      return;
    }
    this.openReward();
  }

  openReward() {
    this.scene = "reward";
    this.reward = this.makeRewardOptions();
    this.message = "选择一项奖励，强化本局构建。";
  }

  makeRewardOptions() {
    const fragments = ["up", "down", "left", "right", "punch", "kick"];
    const fragment = fragments[Math.floor(Math.random() * fragments.length)];
    const external = EXTERNALS.find((item) => !this.player.externals.includes(item.id)) || EXTERNALS[0];
    const internal = INTERNALS.find((item) => !this.player.internals.includes(item.id)) || INTERNALS[0];
    return [
      {
        type: "fragment",
        id: fragment,
        title: `获得碎片：${FRAGMENTS[fragment].name}`,
        tag: "牌库补强",
        description: "加入 1 张碎片牌，提高后续搓招稳定性。",
        effect: `加入 ${FRAGMENTS[fragment].label} ${FRAGMENTS[fragment].name}`
      },
      {
        type: "external",
        id: external.id,
        title: `外功：${external.name}`,
        tag: "招式流派",
        description: "解锁新招式或强化对应招式标签。",
        effect: external.unlockedMoves.length > 0 ? `解锁 ${external.unlockedMoves.length} 个招式` : "强化已有招式效果"
      },
      {
        type: "internal",
        id: internal.id,
        title: `内功：${internal.name}`,
        tag: "规则改写",
        description: internal.description,
        effect: internal.combatText
      }
    ];
  }

  chooseReward(index) {
    const option = this.reward && this.reward[index];
    if (!option) return;
    if (option.type === "fragment") this.player.deck.push(option.id);
    if (option.type === "external" && !this.player.externals.includes(option.id)) this.player.externals.push(option.id);
    if (option.type === "internal" && !this.player.internals.includes(option.id)) this.player.internals.push(option.id);
    this.advanceNode();
  }

  openShop() {
    this.scene = "shop";
    this.message = "行脚商摊开了几件江湖货。";
  }

  buyShop(type) {
    if (type === "fragment" && this.player.gold >= 12) {
      this.player.gold -= 12;
      this.player.deck.push(["punch", "kick", "right"][Math.floor(Math.random() * 3)]);
      this.message = "买入一张实用碎片。";
    }
    if (type === "external" && this.player.gold >= 28) {
      const external = EXTERNALS.find((item) => !this.player.externals.includes(item.id));
      if (external) {
        this.player.gold -= 28;
        this.player.externals.push(external.id);
        this.message = `习得外功：${external.name}`;
      }
    }
    if (type === "heal" && this.player.gold >= 16) {
      this.player.gold -= 16;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 24);
      this.message = "疗伤完毕。";
    }
  }

  openEvent() {
    this.scene = "event";
    this.message = "破庙中有一卷残页，也有未知风险。";
  }

  chooseEvent(type) {
    if (type === "study") {
      const internal = INTERNALS.find((item) => !this.player.internals.includes(item.id));
      if (internal) this.player.internals.push(internal.id);
      this.player.hp = Math.max(1, this.player.hp - 10);
      this.message = "参悟残页，气血受损。";
    }
    if (type === "gold") {
      this.player.gold += 22;
      this.message = "获得一些盘缠。";
    }
    this.advanceNode();
  }

  openRest() {
    this.scene = "rest";
    this.message = "山巅清风，正适合调息。";
  }

  chooseRest(type) {
    if (type === "heal") {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
      this.message = "气血恢复。";
    }
    if (type === "maxHp") {
      this.player.maxHp += 8;
      this.player.hp += 8;
      this.message = "根骨略有精进。";
    }
    this.advanceNode();
  }
}

module.exports = {
  GameState,
  MAX_ACTIONS,
  DRAW_COUNT,
  HAND_LIMIT
};

}, {"../../data/fragments":"data/fragments.js","../../data/moves":"data/moves.js","../../data/externals":"data/externals.js","../../data/internals":"data/internals.js","../../data/enemies":"data/enemies.js","../../data/map":"data/map.js"}],
"src/core/asset-loader.js": [function(require, module, exports) {
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

}, {}],
"src/ui/renderer.js": [function(require, module, exports) {
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

}, {"../../data/map":"data/map.js"}],
"data/fragments.js": [function(require, module, exports) {
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

}, {}],
"data/moves.js": [function(require, module, exports) {
const MOVES = [
  {
    id: "swift_punch",
    name: "顺风拳",
    input: ["down", "right", "punch"],
    tags: ["punch"],
    baseDamage: 12,
    effects: [{ type: "damage", value: 12 }]
  },
  {
    id: "chain_punch",
    name: "连环拳",
    input: ["right", "right", "punch"],
    tags: ["punch", "combo"],
    baseDamage: 8,
    effects: [{ type: "damage", value: 8, hits: 2 }]
  },
  {
    id: "flying_kick",
    name: "飞踢",
    input: ["down", "up", "kick"],
    tags: ["kick"],
    baseDamage: 18,
    effects: [{ type: "damage", value: 18 }, { type: "weaken", value: 1 }]
  },
  {
    id: "guard_palm",
    name: "抱元掌",
    input: ["left", "punch"],
    tags: ["punch", "guard"],
    baseDamage: 7,
    effects: [{ type: "damage", value: 7 }, { type: "block", value: 6 }]
  },
  {
    id: "tiger_breaker",
    name: "伏虎拳",
    input: ["left", "down", "right", "punch"],
    tags: ["punch", "break"],
    baseDamage: 24,
    effects: [{ type: "damage", value: 24 }, { type: "vulnerable", value: 1 }]
  },
  {
    id: "whirlwind_kick",
    name: "旋风腿",
    input: ["down", "right", "up", "kick"],
    tags: ["kick", "aoe"],
    baseDamage: 22,
    effects: [{ type: "damage", value: 22 }, { type: "block", value: 4 }]
  },
  {
    id: "diamond_fist",
    name: "金刚拳",
    input: ["down", "right", "down", "punch"],
    tags: ["punch", "break"],
    baseDamage: 30,
    effects: [{ type: "damage", value: 30 }, { type: "vulnerable", value: 2 }]
  },
  {
    id: "dragon_regret",
    name: "亢龙有悔",
    input: ["right", "right", "right", "punch"],
    tags: ["punch", "burst"],
    baseDamage: 36,
    effects: [{ type: "damage", value: 36 }]
  },
  {
    id: "flower_rain",
    name: "漫天花雨",
    input: ["left", "right", "kick"],
    tags: ["kick", "poison"],
    baseDamage: 14,
    effects: [{ type: "damage", value: 14 }, { type: "poison", value: 3 }]
  },
  {
    id: "nine_sword",
    name: "破式一剑",
    input: ["up", "right", "punch"],
    tags: ["punch", "combo"],
    baseDamage: 16,
    effects: [{ type: "damage", value: 16 }]
  },
  {
    id: "ultimate_dragon",
    name: "降龙绝式",
    input: ["left", "down", "right", "up", "punch"],
    tags: ["punch", "ultimate"],
    baseDamage: 48,
    effects: [{ type: "damage", value: 48 }]
  }
];

const BASE_MOVE_IDS = ["swift_punch", "chain_punch", "flying_kick", "guard_palm"];

module.exports = {
  MOVES,
  BASE_MOVE_IDS
};

}, {}],
"data/externals.js": [function(require, module, exports) {
const EXTERNALS = [
  {
    id: "diamond_style",
    name: "金刚伏魔拳",
    unlockedMoves: ["diamond_fist"],
    passiveModifiers: [{ tag: "punch", damageMultiplier: 1.25 }]
  },
  {
    id: "dragon_style",
    name: "降龙掌",
    unlockedMoves: ["dragon_regret", "ultimate_dragon"],
    passiveModifiers: [{ tag: "burst", damageMultiplier: 1.35 }]
  },
  {
    id: "rain_style",
    name: "暴雨梨花",
    unlockedMoves: ["flower_rain"],
    passiveModifiers: [{ tag: "kick", damageMultiplier: 1.15 }]
  },
  {
    id: "sword_style",
    name: "独孤九剑",
    unlockedMoves: ["nine_sword"],
    passiveModifiers: [{ tag: "combo", damageMultiplier: 1.25 }]
  },
  {
    id: "luohan_style",
    name: "罗汉拳",
    unlockedMoves: [],
    passiveModifiers: [{ tag: "guard", bonusBlock: 4 }]
  },
  {
    id: "taiji_style",
    name: "太极拳",
    unlockedMoves: ["tiger_breaker"],
    passiveModifiers: [{ tag: "break", damageMultiplier: 1.2 }]
  }
];

module.exports = {
  EXTERNALS
};

}, {}],
"data/internals.js": [function(require, module, exports) {
const INTERNALS = [
  {
    id: "jiuyang",
    name: "九阳神功",
    shortName: "九阳",
    ruleHooks: ["freeFirstMove"],
    description: "每回合首次出招不消耗出招次数。",
    combatText: "首招免费"
  },
  {
    id: "beiming",
    name: "北冥神功",
    shortName: "北冥",
    ruleHooks: ["discardDraw"],
    description: "回合结束时，每弃 2 张牌，下回合额外抽 1 张，最多 +2。",
    combatText: "弃牌抽牌"
  },
  {
    id: "yijin",
    name: "易筋经",
    shortName: "易筋",
    ruleHooks: ["formalDamageBoost"],
    description: "正式招式伤害 +15%。",
    combatText: "正式增伤"
  },
  {
    id: "wuxiang",
    name: "小无相功",
    shortName: "无相",
    ruleHooks: ["basicDamageBoost"],
    description: "普通拳和普通腿伤害 +4。",
    combatText: "普攻强化"
  },
  {
    id: "xiantian",
    name: "先天功",
    shortName: "先天",
    ruleHooks: ["thinDeck"],
    description: "战斗开始时临时移除 1 张方向碎片。",
    combatText: "临时瘦牌"
  },
  {
    id: "longxiang",
    name: "龙象般若功",
    shortName: "龙象",
    ruleHooks: ["handPower"],
    description: "手牌每有 1 张，招式伤害 +5%，最多 +30%。",
    combatText: "手牌增伤"
  }
];

module.exports = {
  INTERNALS
};

}, {}],
"data/enemies.js": [function(require, module, exports) {
const ENEMIES = {
  bandit: {
    id: "bandit",
    name: "山贼",
    maxHp: 42,
    block: 0,
    intents: [
      { type: "attack", value: 7, label: "劈砍 7" },
      { type: "block", value: 6, label: "架势 6" }
    ],
    rewards: { gold: 12 }
  },
  swordsman: {
    id: "swordsman",
    name: "游侠剑客",
    maxHp: 55,
    block: 0,
    intents: [
      { type: "attack", value: 9, label: "快剑 9" },
      { type: "attackBlock", value: 6, block: 5, label: "攻守 6/5" }
    ],
    rewards: { gold: 15 }
  },
  monk: {
    id: "monk",
    name: "铜人僧",
    maxHp: 68,
    block: 6,
    intents: [
      { type: "block", value: 10, label: "金钟 10" },
      { type: "attack", value: 11, label: "重掌 11" }
    ],
    rewards: { gold: 18 }
  },
  assassin: {
    id: "assassin",
    name: "唐门刺客",
    maxHp: 50,
    block: 0,
    intents: [
      { type: "attack", value: 8, hits: 2, label: "连针 8x2" },
      { type: "debuff", value: 2, label: "施毒 2" }
    ],
    rewards: { gold: 20 }
  },
  elite: {
    id: "elite",
    name: "黑衣高手",
    maxHp: 86,
    block: 4,
    intents: [
      { type: "attack", value: 14, label: "破空掌 14" },
      { type: "attackBlock", value: 9, block: 8, label: "攻守 9/8" },
      { type: "block", value: 14, label: "护体 14" }
    ],
    rewards: { gold: 28, rare: true }
  },
  boss: {
    id: "boss",
    name: "魔教护法",
    maxHp: 150,
    block: 8,
    intents: [
      { type: "attack", value: 18, label: "炎掌 18" },
      { type: "attack", value: 10, hits: 2, label: "双煞 10x2" },
      { type: "block", value: 18, label: "魔焰护体" },
      { type: "debuff", value: 3, label: "心魔 3" }
    ],
    rewards: { gold: 60, boss: true }
  }
};

module.exports = {
  ENEMIES
};

}, {}],
"data/map.js": [function(require, module, exports) {
const RUN_MAP = [
  {
    floor: 1,
    title: "初入江湖",
    nodes: [
      { type: "battle", enemy: "bandit", label: "山道伏击" },
      { type: "event", label: "破庙奇遇" },
      { type: "elite", enemy: "swordsman", label: "剑客试招" }
    ]
  },
  {
    floor: 2,
    title: "江湖纷争",
    nodes: [
      { type: "battle", enemy: "monk", label: "铜人阵" },
      { type: "shop", label: "行脚商" },
      { type: "battle", enemy: "assassin", label: "暗器来袭" },
      { type: "elite", enemy: "elite", label: "黑衣高手" }
    ]
  },
  {
    floor: 3,
    title: "决战之巅",
    nodes: [
      { type: "battle", enemy: "elite", label: "登顶之战" },
      { type: "rest", label: "山巅调息" },
      { type: "boss", enemy: "boss", label: "魔教护法" }
    ]
  }
];

module.exports = {
  RUN_MAP
};

}, {}]
});
