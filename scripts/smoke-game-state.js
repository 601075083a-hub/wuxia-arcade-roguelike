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

function makeTestCard(id, index) {
  return { uid: `smoke-${id}-${index}`, id };
}

function enterTestBattle(internals, externals) {
  const testState = new GameState();
  testState.player.internals = internals || [];
  testState.player.externals = externals || [];
  testState.startRun();
  testState.enterCurrentNode();
  return testState;
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

state.battle.hand = ["right", "punch", "down", "left", "up"].map(makeTestCard);
let hints = state.getPlayableMoveHints();
assert(hints.some((hint) => hint.id === "swift_punch"), "hand should show a playable unordered formal move");
assert(state.getBasicHandFallbackHint(), "hand with an attack card should show a basic fallback hint");

state.selectHandCard("smoke-right-0");
state.selectHandCard("smoke-punch-1");
state.selectHandCard("smoke-down-2");
let unorderedMove = state.getCurrentMove();
assert(unorderedMove && unorderedMove.id === "swift_punch", "right+punch+down should match down+right+punch");

state.clearSelection();
state.selectHandCard("smoke-right-0");
state.selectHandCard("smoke-punch-1");
state.selectHandCard("smoke-down-2");
state.selectHandCard("smoke-left-3");
let extraCardMove = state.getCurrentMove();
assert(extraCardMove && extraCardMove.fallback === true, "extra selected card should not match the exact formal recipe");

state.clearSelection();
state.selectHandCard("smoke-right-0");
state.selectHandCard("smoke-down-2");
assert(state.getCurrentMove() === null, "direction-only selection should not produce a move");
state.clearSelection();

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

const jiuyangState = enterTestBattle(["jiuyang"], []);
jiuyangState.battle.hand = ["punch"].map(makeTestCard);
jiuyangState.selectHandCard("smoke-punch-0");
jiuyangState.castMove();
assert(jiuyangState.battle.actionsLeft === 3, "jiuyang should make first move free each turn");
assert(jiuyangState.battle.internalTrigger && jiuyangState.battle.internalTrigger.includes("九阳"), "jiuyang should show an internal trigger");

const beimingState = enterTestBattle(["beiming"], []);
beimingState.battle.hand = ["up", "down", "left", "right", "punch", "kick"].map(makeTestCard);
beimingState.endTurn();
assert(beimingState.battle.hand.length === 7, "beiming should cap extra draw at +2");
assert(beimingState.battle.internalTrigger && beimingState.battle.internalTrigger.includes("北冥"), "beiming should show an internal trigger");

const wuxiangState = enterTestBattle(["wuxiang"], []);
wuxiangState.battle.hand = ["punch"].map(makeTestCard);
wuxiangState.selectHandCard("smoke-punch-0");
assert(wuxiangState.estimateDamage(wuxiangState.getCurrentMove()) === 9, "wuxiang should add +4 to basic punch");

const yijinState = enterTestBattle(["yijin"], []);
yijinState.battle.hand = ["down", "right", "punch"].map(makeTestCard);
yijinState.selectHandCard("smoke-right-1");
yijinState.selectHandCard("smoke-punch-2");
yijinState.selectHandCard("smoke-down-0");
assert(yijinState.estimateDamage(yijinState.getCurrentMove()) === 14, "yijin should add +15% to formal moves");

const xiantianState = enterTestBattle(["xiantian"], []);
const xiantianCards = xiantianState.battle.hand.length + xiantianState.battle.drawPile.length + xiantianState.battle.discardPile.length;
assert(xiantianCards === 11, "xiantian should temporarily remove one direction fragment at battle start");
assert(xiantianState.battle.internalTrigger && xiantianState.battle.internalTrigger.includes("先天"), "xiantian should show an internal trigger");

console.log("smoke-game-state passed");
