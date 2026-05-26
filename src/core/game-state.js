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
    if (this.hasHook("thinDeck")) {
      const removeIndex = deckIds.findIndex((id) => FRAGMENTS[id].type === "direction");
      if (removeIndex >= 0) deckIds.splice(removeIndex, 1);
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
      flash: 0
    };

    this.player.block = 0;
    this.drawCards(DRAW_COUNT);
    this.scene = "battle";
    this.message = "点击手牌组成搓招序列。";
  }

  hasHook(hook) {
    return this.player.internals.some((id) => {
      const internal = this.internalMap[id];
      return internal && internal.ruleHooks.includes(hook);
    });
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
    const matched = this.getUnlockedMoves().find((move) => {
      if (move.input.length !== input.length) return false;
      return move.input.every((id, index) => id === input[index]);
    });
    if (matched) return matched;
    return this.getBasicFallbackMove(input);
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
    if (!move) return 0;
    let multiplier = 1;
    this.player.externals.forEach((id) => {
      const external = this.externalMap[id];
      if (!external) return;
      external.passiveModifiers.forEach((modifier) => {
        if (modifier.damageMultiplier && move.tags.includes(modifier.tag)) {
          multiplier *= modifier.damageMultiplier;
        }
      });
    });
    if (this.hasHook("directionFlex") || this.hasHook("attackFlex")) multiplier *= 1.1;
    if (this.hasHook("handPower") && this.battle) multiplier *= 1 + this.battle.hand.length * 0.05;
    if (this.battle && this.battle.enemy.vulnerable > 0) multiplier *= 1.25;
    return Math.max(1, Math.round(move.baseDamage * multiplier));
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

    const damage = this.estimateDamage(move);
    this.damageEnemy(damage);
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

    const extra = this.hasHook("discardDraw") ? Math.floor(discarded / 2) : 0;
    this.player.block = 0;
    this.battle.turn += 1;
    this.battle.actionsLeft = MAX_ACTIONS;
    this.battle.firstMoveCast = false;
    this.drawCards(DRAW_COUNT + extra);
    this.battle.log.unshift(`第 ${this.battle.turn} 回合，抽取 ${DRAW_COUNT + extra} 张。`);
    this.message = "新回合开始。";
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
      { type: "fragment", id: fragment, title: `获得碎片：${FRAGMENTS[fragment].name}` },
      { type: "external", id: external.id, title: `外功：${external.name}` },
      { type: "internal", id: internal.id, title: `内功：${internal.name}` }
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
