// src/reputation-contract/sdk.ts
function useStore(key, defaultValue) {
  return (state) => [
    () => state.get(key) ?? defaultValue,
    (value) => state.set(key, value)
  ];
}
function useMapping(keys, defaultValue) {
  return (state) => [
    (...args) => {
      const interleavedKey = [keys[0]];
      const pathKeys = keys.slice(1);
      for (let i = 0; i < pathKeys.length; i++) {
        interleavedKey.push(pathKeys[i], args[i]);
      }
      return state.get(interleavedKey.join("/")) ?? defaultValue;
    },
    (...args) => {
      const interleavedKey = [keys[0]];
      const pathKeys = keys.slice(1);
      const keyArgs = args.slice(0, -1);
      for (let i = 0; i < pathKeys.length; i++) {
        interleavedKey.push(pathKeys[i], keyArgs[i]);
      }
      state.set(interleavedKey.join("/"), args[args.length - 1]);
    }
  ];
}

// src/reputation-contract/reputation.ts
var admin = useStore("admin", "");
var Contract = class {
  msg;
  address;
  admin;
  setAdmin;
  constructor(state, { msg, address }) {
    this.msg = msg;
    this.address = address;
    [this.admin, this.setAdmin] = admin(state);
    this.setAdmin(msg.sender);
  }
  getAdmin() {
    return this.admin();
  }
};

// src/reputation-contract/index.ts
var reputation_contract_default = Contract;
export {
  Contract,
  reputation_contract_default as default,
  useMapping,
  useStore
};
//# sourceMappingURL=reputationContract.js.map
