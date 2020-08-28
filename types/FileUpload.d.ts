import type { Params, File, RequestParams } from './types';
export declare class FileUpload {
    params: Params;
    hash: string;
    worker: Worker | undefined;
    hashPercentage: number;
    data: any[];
    requestList: XMLHttpRequest[] | undefined;
    constructor(params: Params);
    startUpload(sucess: () => void, error: () => void): Promise<void>;
    uploadChunks(uploadedList?: number[]): Promise<void>;
    createFileChunk(file: File, size?: number): File[];
    calculateHash(fileChunkList: File[]): Promise<string>;
    verifyUpload(filename: string, fileHash: string): Promise<any>;
    createProgressHandler(item: any): (ev: ProgressEvent) => any;
    request({ url, method, data, headers, onProgress, requestList }: RequestParams): Promise<any>;
    mergeRequest(): Promise<void>;
}
