// src/contract1/index.ts
function reset(state) {
  const newValue = 0;
  state.value = 0;
  return newValue;
}
function inc(state, { x }) {
  const oldValue = state.value ?? 0;
  const newValue = oldValue + x;
  state.value = newValue;
  return newValue;
}
function dec(state, { x }) {
  const oldValue = state.value ?? 0;
  const newValue = oldValue - x;
  state.value = newValue;
  return newValue;
}
function read(state) {
  return state.value;
}
export {
  dec,
  inc,
  read,
  reset
};
//# sourceMappingURL=bundle1.js.map
