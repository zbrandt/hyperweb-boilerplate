// @ts-ignore, `~bank` is an internal package
import { getBalance, sendCoins } from '~bank';

import { useMapping, useStore } from './sdk';
import { MappingStore, Msg, State, Store } from './types'

const amount: Store<number> = useStore('amount', 0);
const buyer: Store<string> = useStore('buyer', '');
const seller: Store<string> = useStore('seller', '');
const agent: Store<string> = useStore('agent', '');

export class Contract {
    msg: Msg;
    address: string;
    amount;
    setAmount;
    buyer;
    setBuyer;
    seller;
    setSeller;
    agent;
    setAgent;

    constructor(state: State, {msg, address}: {msg: Msg, address: string}) {
        this.msg = msg;
        this.address = address;

        [this.amount, this.setAmount] = amount(state);
        [this.buyer, this.setBuyer] = buyer(state);
        [this.seller, this.setSeller] = seller(state);
        [this.agent, this.setAgent] = agent(state);
    }

    token: string = "uusdc"; // ibc denom for usdc

    deposit(amount: number, buyer: string) {
        // if (this.amount() !== 0) {
        //     throw Error("escrow already has funds");
        // }
        if (amount <= 0) {
        throw Error("invalid amount");
        }
        this.setAmount(amount);
        this.setBuyer(buyer);
    }

    release(tokenIn: string, seller: string) {
        if (this.amount() === 0) {
            throw Error("escrow has no funds");
        }
        const buyer = this.buyer();
        if (buyer === '' || seller === '') {
            throw Error("missing buyer, seller, or agent");
        }
        sendCoins(this.address, seller, {[tokenIn]: this.amount()});
        this.setAmount(0);
        // this.setBuyer('');
        this.setSeller('');
        this.setAgent('');
    }

    cancel(tokenIn: string) {
        if (this.amount() === 0) {
            throw Error("escrow has no funds");
        }
        const buyer = this.buyer();
        const agent = this.agent();
        if (buyer === '' || agent === '') {
            throw Error("missing buyer or agent");
        }
        sendCoins(this.address, buyer, {[tokenIn]: this.amount()});
        this.setAmount(0);
        this.setBuyer('');
        this.setSeller('');
        this.setAgent('');
    }

    getDeposited(): number {
        return this.amount();
    }

}
