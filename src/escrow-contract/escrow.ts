// @ts-ignore, `~bank` is an internal package
import { sendCoins } from '~bank';

import { useStore } from './sdk';
import { Msg, State, Store } from './types'

const amount: Store<number> = useStore('amount', 0);
const buyer: Store<string> = useStore('buyer', '');
const seller: Store<string> = useStore('seller', '');
const agent: Store<string> = useStore('agent', '');

export class Contract {
    msg: Msg;
    address: string;
    amount;
    setAmount;
    token: string;
    buyer;
    setBuyer;
    seller;
    setSeller;
    agent;
    setAgent;

    constructor(state: State, {msg, address, token}: {msg: Msg, address: string, token: string}) {
        this.msg = msg;
        this.address = address;

        [this.amount, this.setAmount] = amount(state);
        [this.buyer, this.setBuyer] = buyer(state);
        [this.seller, this.setSeller] = seller(state);
        [this.agent, this.setAgent] = agent(state);

        this.token = token;
        this.setAgent(msg.sender);
    }

    getAgent(): string {
        return this.agent();
    }

    getDeposited(): number {
        return this.amount();
    }

    setBuyerAddress({address}: {address: string}): string {
        if (this.msg.sender !== this.agent()) {
            throw Error("only agent can set buyer");
        }
        this.setBuyer(address);
        return this.buyer();
    }

    deposit({amount}: {amount: number}): number {
        if (this.buyer() === '') {
            throw Error("missing buyer");
        }
        if (this.msg.sender !== this.buyer()) {
            throw Error("only buyer can deposit");
        }
        if (this.amount() !== 0) {
            throw Error("escrow already has funds");
        }
        if (amount <= 0) {
            throw Error("invalid amount");
        }
        this.setAmount(amount);
        
        sendCoins(this.buyer(), this.address, {
            [this.token]: amount
        });
        return this.amount();
    }

    setSellerAddress({address}: {address: string}): string {
        if (this.msg.sender !== this.agent()) {
            throw Error("only agent can set seller");
        }
        this.setSeller(address);
        return this.seller();
    }

    release(): void {
        if (this.msg.sender !== this.seller()) {
            throw Error("only agent can release funds");
        }
        if (this.amount() === 0) {
            throw Error("escrow has no funds");
        }
        sendCoins(this.address, this.seller(), {
            [this.token]: this.amount()
        });
        this.setAmount(0);
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
}
