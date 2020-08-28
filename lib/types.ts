export interface File extends Blob {
    size:number,
    slice: (start: number, end: number) => File,
    name: string
}

export type Params = {
    concurrency?: number,
    chunkSize?: number,
    locale?: string,
    again?: number,
    file?: File,
    debug?: CONSOLE_ENUM | undefined
}

export type RequestParams = {
    url: string,
    method?: string,
    headers?: any,
    data?: any,
    onProgress?:((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    requestList?: XMLHttpRequest[]
}

export type VerifyUpload = {
    shouldUpload: boolean, // 是否应该上传，否代表文件早已经上传过了
    uploadedList: number[], // 已经上传 chunks 的 hash 列表
}

export enum CONSOLE_ENUM {
    error="error",
    log="log",
    info="info",
    warn="warn"
}