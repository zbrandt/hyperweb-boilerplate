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

    adjustScore({address, score}: {address: string, score: number}): User {
        if (!this.users(address).registered) {
            throw Error("user not registered");
        }
        this.setUsers(address, {address: address, score: score, registered: true});
        return this.users(address);
    }

    evaluateUser({address, change}: {address: string, change: number}): User {
        if (!this.users(address).registered) {
            throw Error("user not registered");
        }
        const user = this.users(address);
        const newScore = user.score + change;
        if (newScore < 0) {
            throw Error("score cannot be negative");
        }
        this.setUsers(address, {address: address, score: newScore, registered: true});
        return this.users(address);
    }
}