export function reset(state) {
  const newValue = 0;
  state.set('value', 0);
  return newValue
}
export function inc(state, {x}) {
  const oldValue = state.get('value') ?? 0;
  const newValue = oldValue + x;
  state.set('value', newValue);
  return newValue
}
export function dec(state, {x}) {
  const oldValue = state.get('value') ?? 0;
  const newValue = oldValue - x;
  state.set('value', newValue);
  return newValue
}

export function read(state) {
  return state.get('value');
}
