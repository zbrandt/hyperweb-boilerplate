import { useMapping, useStore } from './sdk';
import { MappingStore, Msg, State, Store } from './types';

const admin: Store<string> = useStore('admin', '');
const users: MappingStore<[string], User> = useMapping(['address'], {
    address: "",
    score: 0,
    registered: false as boolean
});

interface User {
    address: string;
    score: number;
    registered: boolean;
}

export class Contract {
    msg: Msg;
    address: string;
    admin;
    setAdmin;
    users;
    setUsers;

    constructor(state: State, {msg, address}: {msg: Msg, address: string}) {
        this.msg = msg;
        this.address = address;

        [this.admin, this.setAdmin] = admin(state);
        [this.users, this.setUsers] = users(state);
        this.setAdmin(msg.sender);
    }

    getAdmin(): string {
        return this.admin();
    }

    getUser(address: string): User {
        return this.users(address);
    }

    registerUser({address}: {address: string}): string {
        if (this.users(address).registered) {
            throw Error("user already registered");
        }
        const newUser: User = {
            address: address,
            score: 500, // initial credit score
            registered: true
        };
        this.setUsers(address, newUser);
        return address;
    }

    // should be restricted to admin, but no way to check sender
    adjustScore({address, score}: {address: string, score: number}): User {
        // throw Error(`this.msg.sender: ${this.msg.sender}, this.admin(): ${this.admin()}`);
        if (this.msg.sender !== this.admin()) {
            throw Error("only admin can adjust score");
        }
        if (!this.users(address).registered) {
            throw Error("user not registered");
        }
        this.setUsers(address, {address: address, score: score, registered: true});
        return this.users(address);
    }

    // should be restricted to users with sufficient credit score, but no way to check sender
    evaluateUser({address, change}: {address: string, change: number}): User {
        if (!this.users(this.msg.sender).registered) {
            throw Error("user not registered");
        }
        const user = this.users(address);
        const weight = this.users(this.msg.sender).score / 500;
        const newScore = user.score + (change * weight);
        if (newScore < 0) {
            throw Error("score cannot be negative");
        }
        this.setUsers(address, {address: address, score: newScore, registered: true});
        return this.users(address);
    }
}