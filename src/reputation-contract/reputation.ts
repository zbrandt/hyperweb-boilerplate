import { useStore } from './sdk';
import { Msg, State, Store } from './types';

const admin: Store<string> = useStore('admin', '');

export class Contract {
    msg: Msg;
    address: string;
    admin;
    setAdmin;

    constructor(state: State, {msg, address}: {msg: Msg, address: string}) {
        this.msg = msg;
        this.address = address;

        [this.admin, this.setAdmin] = admin(state);
        this.setAdmin(msg.sender);
    }

    getAdmin(): string {
        return this.admin();
    }
}