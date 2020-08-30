import { Params, File, RequestParams, VerifyUpload } from './types';
import Tapable from "./Tapable";
export default class FileUpload extends Tapable {
    params: Params;
    hash: string;
    hashPercentage: number;
    data: any[];
    requestList: XMLHttpRequest[] | undefined;
    constructor(params: Params);
    addFile(file: File): void;
    startUpload(): Promise<void>;
    uploadChunks(uploadedList: number[] | undefined, file: File): Promise<void>;
    createFileChunk(file: File, size?: number): File[];
    calculateHash(fileChunkList: File[]): Promise<string>;
    verifyUpload(filename: string, fileHash: string): Promise<VerifyUpload | undefined>;
    createProgressHandler(item: any, file: File): (ev: ProgressEvent) => any;
    request({ url, method, data, headers, onProgress, }: RequestParams): (() => Promise<any>);
    mergeRequest(file: File): Promise<void>;
}
