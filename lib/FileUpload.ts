import { Params, File, RequestParams, VerifyUpload, CONSOLE_ENUM } from './types'
import Tapable from "./Tapable";
const ONE_M = 1024 * 1024; // 1M
export class FileUpload extends Tapable {
    params: Params
    hash: string
    hashPercentage: number
    data: any[]
    requestList: XMLHttpRequest[] | undefined
    constructor(params: Params = { chunkSize: 5 * ONE_M, concurrency: 5, locale: 'zh', again: 3, debug: undefined }) {
        super(params.debug)
        this.params = Object.assign({}, params)
        this.hash = ''
        this.hashPercentage = 0
        this.data = []
    }

    addFile(file: File): void {
        if (!this.params.file) {
            this.params.file = file
        } else {
            this.log('已经有文件，请不要重复添加')
        }
    }

    async startUpload(): Promise<void> {
        if (!this.params.file) {
            // this.emit('error', { status: 3, message: '请先传入文件，在开始上传' })
            this.log('请先传入文件，在开始上传')
            return
        }
        const fileChunkList = this.createFileChunk(this.params.file, this.params.chunkSize)
        this.hash = await this.calculateHash(fileChunkList)
        const { shouldUpload, uploadedList } = await this.verifyUpload(
            this.params.file.name,
            this.hash
        );
        if (!shouldUpload) {
            this.emit('sucess', { status: 1 })
            return;
        }
        this.data = fileChunkList.map((file, index) => ({
            fileHash: this.hash,
            index,
            hash: this.hash + "-" + index,
            chunk: file,
            size: file.size,
            percent: uploadedList.includes(index) ? 100 : 0
        }));
        await this.uploadChunks(uploadedList, this.params.file);
    }

    // 上传切片，同时过滤已上传的切片
    async uploadChunks(uploadedList: number[] = [], file: File): Promise<void> {
        // let that = this
        const requestList = this.data
            .filter(({ hash }) => !uploadedList.includes(hash))
            .map(({ chunk, hash, index }) => {
                const formData = new FormData();
                formData.append("chunk", chunk);
                formData.append("hash", hash);
                formData.append("fileHash", this.hash);
                formData.append("filename", file.name);
                return { formData, index };
            })
            .map(async ({ formData, index }) =>
                this.request({
                    url: "http://localhost:3000",
                    data: formData,
                    onProgress: this.createProgressHandler(this.data[index], file),
                })
            );
            // TODO 通过用户传入的值来控制并发数
            await Promise.all(requestList);
            // 之前上传的切片数量 + 本次上传的切片数量 = 所有切片数量时
            // 合并切片
            if (uploadedList.length + requestList.length === this.data.length) {
                await this.mergeRequest();
            }
    }

    createFileChunk(file: File, size = ONE_M * 10): File[] {
        const fileChunkList: File[] = [];
        let cur = 0;
        while (cur < file.size) {
            fileChunkList.push(file.slice(cur, cur + size));
            cur += size;
        }
        return fileChunkList;
    }

    calculateHash(fileChunkList: File[]): Promise<string> {
        return new Promise(resolve => {
            let worker = new Worker("/hash1.js");
            worker.postMessage({ fileChunkList });
            worker.onmessage = (e): void => {
                const { hash, percent } = e.data;
                this.emit('process', percent * 0.25)
                if (hash) {
                    resolve(hash);
                }
            };
        });
    }
    async verifyUpload(filename: string, fileHash: string): Promise<VerifyUpload> {
        let options: RequestParams = {
            url: "http://localhost:3000/verify",
            headers: {
                "content-type": "application/json"
            },
            data: JSON.stringify({
                filename,
                fileHash
            })
        }
        const { data } = await this.request(options);
        return JSON.parse(data);
    }

    // 用闭包保存每个 chunk 的进度数据
    createProgressHandler(item: any, file: File): (ev: ProgressEvent) => any {
        return (e): void => {
            item.percent = parseInt(String((e.loaded / e.total) * 100));
            if (file || !this.data.length) {
                this.emit('process', 0)
            }
            const loaded = this.data.map(item1 => item1.size * item1.percent).reduce((acc, cur) => acc + cur);
            let precent = parseInt((loaded / file.size).toFixed(2)) * 0.75 + 25
            this.emit('process', precent)
            if (precent === 100) {
                this.emit('sucess')
            }
        };
    }

    // xhr
    request({
        url,
        method = "post",
        data,
        headers = {},
        onProgress = (): any => { },
    }: RequestParams): Promise<any> {
        return new Promise(resolve => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = onProgress;
            xhr.open(method, url);
            Object.keys(headers).forEach(key =>
                xhr.setRequestHeader(key, headers[key])
            );
            xhr.send(data);
            xhr.onload = (e: any): void => {
                // 将请求成功的 xhr 从列表中删除
                resolve({
                    data: e.target.response
                });
            };
        });
    }

    // 通知服务端合并切片
    async mergeRequest(): Promise<void> {
        await this.request({
            url: "http://localhost:3000/merge",
            headers: {
                "content-type": "application/json"
            },
            data: JSON.stringify({
                size: this.params.chunkSize,
                fileHash: this.hash,
                filename: this.params.file.name
            })
        });
    }
}