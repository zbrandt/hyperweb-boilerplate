// src/escrow-contract/sdk.ts
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

// src/escrow-contract/escrow.ts
import { sendCoins } from "~bank";
var amount = useStore("amount", 0);
var buyer = useStore("buyer", "");
var seller = useStore("seller", "");
var agent = useStore("agent", "");
var Contract = class {
  msg;
  address;
  amount;
  setAmount;
  buyer;
  setBuyer;
  seller;
  setSeller;
  agent;
  setAgent;
  constructor(state, { msg, address }) {
    this.msg = msg;
    this.address = address;
    [this.amount, this.setAmount] = amount(state);
    [this.buyer, this.setBuyer] = buyer(state);
    [this.seller, this.setSeller] = seller(state);
    [this.agent, this.setAgent] = agent(state);
  }
  token = "uusdc";
  // ibc denom for usdc
  deposit(amount2, buyer2) {
    if (amount2 <= 0) {
      throw Error("invalid amount");
    }
    this.setAmount(amount2);
    this.setBuyer(buyer2);
  }
  release(tokenIn, seller2) {
    this.setAmount(0);
    this.setSeller("");
    this.setAgent("");
  }
  cancel() {
    if (this.amount() === 0) {
      throw Error("escrow has no funds");
    }
    const buyer2 = this.buyer();
    const agent2 = this.agent();
    if (buyer2 === "" || agent2 === "") {
      throw Error("missing buyer or agent");
    }
    sendCoins(agent2, buyer2, this.amount());
    this.setAmount(0);
    this.setBuyer("");
    this.setSeller("");
    this.setAgent("");
  }
  getDeposited() {
    return this.amount();
  }
};

// src/escrow-contract/index.ts
var escrow_contract_default = Contract;
export {
  Contract,
  escrow_contract_default as default,
  useMapping,
  useStore
};
//# sourceMappingURL=escrowContract.js.map
