import {CONSOLE_ENUM} from './types'
type EVENTS = {
    [propName:string]: ((...args: any[]) => any)[] | undefined
}
export default class Tapable {
    events:EVENTS
    debug: CONSOLE_ENUM | undefined
    constructor(debug:CONSOLE_ENUM | undefined) {
        this.events = {}
        this.debug = debug
    }

    on(name: string, callback:((args:any)=>any)):void {
        if(this.events[name]) {
            this.events[name]?.push(callback)
        } else {
            this.events[name] = [callback]
        }
    }

    emit(name:string, ...args:any[]):void {
        if(this.events[name]) {
            this.events[name]?.forEach(item => {
                item(...args)
            })
        }
    }
    
    log(msg: string, mode = CONSOLE_ENUM.error): void {
        let allowMode = [CONSOLE_ENUM.info, CONSOLE_ENUM.log]
        if (this.debug === CONSOLE_ENUM.warn) {
            allowMode.push(CONSOLE_ENUM.warn)
        }
        if (this.debug === CONSOLE_ENUM.error) {
            allowMode.push(CONSOLE_ENUM.warn, CONSOLE_ENUM.error)
        }
        if (allowMode.includes(mode)) {
            console[mode]('【FileUpload】 ' + msg)
        }
    }
}