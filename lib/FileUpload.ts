import { Params, File, RequestParams, VerifyUpload, CONSOLE_ENUM } from './types'
import Tapable from "./Tapable";
import concurrency from './Concurrency';
const ONE_M = 1024 * 1024; // 1M
export default class FileUpload extends Tapable { 
    params: Params = { chunkSize: 5, concurrency: 5, locale: 'zh', again: 3, debug: undefined }
    hash = ''
    hashPercentage = 0
    data: any[] = []
    requestList: XMLHttpRequest[] | undefined

    constructor(params: Params) {
        super(params.debug)
        this.params = Object.assign(this.params, params)
        this.params.chunkSize = this.params.chunkSize ? this.params.chunkSize * ONE_M : 5 * ONE_M
    } 

    addFile(file: File): void {
        if (!this.params.file) {
            this.params.file = file
        } else {
            this.log('已经有文件，请不要重复添加', CONSOLE_ENUM.error)
        }
    }

    async startUpload(): Promise<void> {
        try {
            if (!this.params.file) {
                this.log('请先传入文件，在开始上传', CONSOLE_ENUM.error)
                return
            }
            const fileChunkList = this.createFileChunk(this.params.file, this.params.chunkSize)
            this.log(`代码分块完成，分为 ${fileChunkList.length} 块`)
            let startTime = Date.now()
            this.hash = await this.calculateHash(fileChunkList)
            this.log(`hash 计算完成，耗时为: ${Date.now() - startTime} ms`)
            const returnVerify = await this.verifyUpload(
                this.params.file.name,
                this.hash
            );
            if(returnVerify) {
                let { shouldUpload, uploadedList } = returnVerify
                if (!shouldUpload) {
                    this.emit('process', 100)
                    this.emit('sucess', { status: 1 })
                    this.log('该文件已经上传过，因此秒传')
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
        } catch (error) {
            
        }
    }

    // 上传切片，同时过滤已上传的切片
    async uploadChunks(uploadedList: number[] = [], file: File): Promise<void> {
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
            .map(({ formData, index }) =>
                this.request({
                    url: "http://localhost:3000",
                    data: formData,
                    onProgress: this.createProgressHandler(this.data[index], file),
                })
            );
            let result = await concurrency(requestList, () => {}, { concurrency: this.params.concurrency, again: this.params.again})
            if(!Array.isArray(result)) {
                this.emit('error', { status: 2, message: '上传请求报错'})
                this.log('上传请求报错', CONSOLE_ENUM.error)
                return 
            }
            // 之前上传的切片数量 + 本次上传的切片数量 = 所有切片数量时
            // 合并切片
            if (uploadedList.length + requestList.length === this.data.length) {
                await this.mergeRequest(file);
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
            let worker = new Worker("/hash.js");
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

    async verifyUpload(filename: string, fileHash: string): Promise<VerifyUpload | undefined> {
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
        try {
            const { data } = await this.request(options)();
            return JSON.parse(data);       
        } catch (error) {
            this.emit('error', { status: 3, message: '验证请求报错'})
            this.log('验证请求报错', CONSOLE_ENUM.error)
        }
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
        };
    }

    request({
        url,
        method = "post",
        data,
        headers = {},
        onProgress = (): any => { },
    }: RequestParams): (() => Promise<any>) {
        return function ():Promise<any> {
            return new Promise(resolve => {
                const xhr = new XMLHttpRequest();
                xhr.upload.onprogress = onProgress;
                xhr.open(method, url);
                Object.keys(headers).forEach(key =>
                    xhr.setRequestHeader(key, headers[key])
                );
                xhr.send(data);
                xhr.onload = (e: any): void => {
                    resolve({
                        data: e.target.response
                    });
                };
            });
        }
    }

    // 通知服务端合并切片
    async mergeRequest(file: File): Promise<void> {
        try {
            await this.request({
                url: "http://localhost:3000/merge",
                headers: {
                    "content-type": "application/json"
                },
                data: JSON.stringify({
                    size: this.params.chunkSize,
                    fileHash: this.hash,
                    filename: file.name
                })
            })()
            this.emit('sucess')
        } catch (error) {
            this.emit('error', { status: 4, message: '合并请求报错'})
            this.log('合并请求报错', CONSOLE_ENUM.error)
        }
    }
}