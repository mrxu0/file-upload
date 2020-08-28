import {CONSOLE_ENUM} from './types'
type EVENTS = {
    [propName:string]: ((...args: any[]) => any)[] | undefined
}
export default class Tapable {
    events:EVENTS
    debug: CONSOLE_ENUM[] | undefined
    constructor(debug:CONSOLE_ENUM[] | undefined) {
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
        } else {
            this.log(`【${name}】 还没有注册`, CONSOLE_ENUM.warn)
        }
    }

    log(msg: string, mode = CONSOLE_ENUM.log): void {
        if(this.debug?.includes(mode)) {
            console[mode]('【FileUpload】 ' + msg)
        }
        // let allowMode = [CONSOLE_ENUM.error]
        // if (this.debug === CONSOLE_ENUM.info || this.debug === CONSOLE_ENUM.log) {
        //     allowMode.push(CONSOLE_ENUM.warn, CONSOLE_ENUM.error)
        // }
        // if (this.debug === CONSOLE_ENUM.warn) {
        //     allowMode.push(CONSOLE_ENUM.warn)
        // }
        // if (allowMode.includes(mode)) {
        //     console[mode]('【FileUpload】 ' + msg)
        // }
    }
}