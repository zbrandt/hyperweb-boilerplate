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
var users = useMapping(["address"], {
  address: "",
  score: 0,
  registered: false
});
var Contract = class {
  msg;
  address;
  admin;
  setAdmin;
  users;
  setUsers;
  constructor(state, { msg, address }) {
    this.msg = msg;
    this.address = address;
    [this.admin, this.setAdmin] = admin(state);
    [this.users, this.setUsers] = users(state);
    this.setAdmin(msg.sender);
  }
  getAdmin() {
    return this.admin();
  }
  getUser(address) {
    return this.users(address);
  }
  registerUser({ address }) {
    if (this.users(address).registered) {
      throw Error("user already registered");
    }
    const newUser = {
      address,
      score: 500,
      // initial credit score
      registered: true
    };
    this.setUsers(address, newUser);
    return address;
  }
  adjustScore({ address, score }) {
    if (!this.users(address).registered) {
      throw Error("user not registered");
    }
    this.setUsers(address, { address, score, registered: true });
    return this.users(address);
  }
  evaluateUser({ address, change }) {
    if (!this.users(address).registered) {
      throw Error("user not registered");
    }
    const user = this.users(address);
    const newScore = user.score + change;
    if (newScore < 0) {
      throw Error("score cannot be negative");
    }
    this.setUsers(address, { address, score: newScore, registered: true });
    return this.users(address);
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
