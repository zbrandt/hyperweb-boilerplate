import { useMapping, useStore } from './sdk';
import { MappingStore, Msg, State, Store } from './types';

const admin: Store<string> = useStore('admin', '');
const users: MappingStore<[string], User> = useMapping(['address'], {
    score: 0,
    registered: false as boolean
});

interface User {
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

    registerUser({address}: {address: string}) {
        if (this.users(address).registered) {
            throw Error("user already registered");
        }
        const newUser: User = {
            score: 500, // initial credit score
            registered: true
        };
        this.setUsers(address, newUser);
        return address;
    }
}