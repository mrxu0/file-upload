import { CONSOLE_ENUM } from './types';
declare type EVENTS = {
    [propName: string]: ((...args: any[]) => any)[] | undefined;
};
export default class Tapable {
    events: EVENTS;
    debug: CONSOLE_ENUM[] | undefined;
    constructor(debug: CONSOLE_ENUM[] | undefined);
    on(name: string, callback: ((args: any) => any)): void;
    emit(name: string, ...args: any[]): void;
    log(msg: string, mode?: CONSOLE_ENUM): void;
}
export {};
