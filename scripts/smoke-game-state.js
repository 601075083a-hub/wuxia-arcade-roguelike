const { GameState } = require("../src/core/game-state");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findAttackCard(state) {
  let card = state.battle.hand.find((item) => {
    const fragment = state.fragmentMap[item.id];
    return fragment && fragment.type === "attack";
  });
  if (!card) {
    card = { uid: "smoke-punch", id: "punch" };
    state.battle.hand[0] = card;
  }
  return card;
}

const state = new GameState();

assert(state.scene === "title", "initial scene should be title");

state.startRun();
assert(state.scene === "map", "startRun should enter map");

state.player.internals = [];
state.enterCurrentNode();
assert(state.scene === "battle", "first map node should enter battle");
assert(state.battle, "battle state should exist");
assert(state.battle.hand.length === 5, "battle should draw 5 cards");

const attackCard = findAttackCard(state);
const handBeforeCast = state.battle.hand.length;
const hpBeforeCast = state.battle.enemy.hp;
const actionsBeforeCast = state.battle.actionsLeft;

state.selectHandCard(attackCard.uid);
const move = state.getCurrentMove();
assert(move, "attack fragment should produce a move");
assert(move.fallback === true, "single punch/kick should produce a basic fallback move");

state.castMove();
assert(state.scene === "battle", "basic fallback move should not end the battle");
assert(state.battle.enemy.hp < hpBeforeCast, "castMove should damage the enemy");
assert(state.battle.actionsLeft === actionsBeforeCast - 1, "castMove should consume one action");
assert(state.battle.hand.length === handBeforeCast - 1, "castMove should consume selected card");
assert(state.battle.selected.length === 0, "castMove should clear selected cards");

const hpBeforeEndTurn = state.player.hp;
state.endTurn();
assert(state.scene === "battle", "endTurn should keep battle running");
assert(state.battle.turn === 2, "endTurn should advance to turn 2");
assert(state.battle.hand.length === 5, "new turn should draw 5 cards");
assert(state.battle.actionsLeft === 3, "new turn should reset actions");
assert(state.player.hp < hpBeforeEndTurn, "enemy intent should damage the player");

console.log("smoke-game-state passed");
