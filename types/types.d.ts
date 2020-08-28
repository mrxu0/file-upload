export declare type File = {
    size: number;
    slice: (start: number, end: number) => File;
    name: string;
};
export declare type Params = {
    concurrency?: number;
    chunkSize?: number;
    locale?: string;
    again?: number;
    file: File;
};
export declare type RequestParams = {
    url: string;
    method?: string;
    headers?: any;
    data?: any;
    onProgress?: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    requestList?: XMLHttpRequest[];
};
