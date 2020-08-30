export interface File extends Blob {
    size: number;
    slice: (start: number, end: number) => File;
    name: string;
}
export declare type Params = {
    concurrency?: number;
    chunkSize?: number;
    locale?: string;
    again?: number;
    file?: File;
    debug?: CONSOLE_ENUM[] | undefined;
};
export declare type RequestParams = {
    url: string;
    method?: string;
    headers?: any;
    data?: any;
    onProgress?: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    requestList?: XMLHttpRequest[];
};
export declare type VerifyUpload = {
    shouldUpload: boolean;
    uploadedList: number[];
};
export declare enum CONSOLE_ENUM {
    error = "error",
    log = "log",
    warn = "warn"
}
