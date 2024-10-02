// src/contract1/index.ts
function reset(state) {
  const newValue = 0;
  state.set("value", 0);
  return newValue;
}
function inc(state, { x }) {
  const oldValue = state.get("value") ?? 0;
  const newValue = oldValue + x;
  state.set("value", newValue);
  return newValue;
}
function dec(state, { x }) {
  const oldValue = state.get("value") ?? 0;
  const newValue = oldValue - x;
  state.set("value", newValue);
  return newValue;
}
function read(state) {
  return state.get("value");
}
export {
  dec,
  inc,
  read,
  reset
};
//# sourceMappingURL=contract1.js.map
