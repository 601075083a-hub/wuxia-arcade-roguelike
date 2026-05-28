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
      internals: state.player.internals
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
        fallback: Boolean(move.fallback)
      } : null,
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

document.querySelectorAll("[data-dev-action]").forEach((button) => {
  button.addEventListener("click", () => {
    dispatchPreviewAction(button.dataset.devAction);
  });
});

game.start();
setTimeout(refreshDevPanel, 0);
