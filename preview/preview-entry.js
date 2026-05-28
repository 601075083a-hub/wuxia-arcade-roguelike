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
