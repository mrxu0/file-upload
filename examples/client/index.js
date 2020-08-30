(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('aggregate-error')) :
    typeof define === 'function' && define.amd ? define(['aggregate-error'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.FileUpload = factory(global.AggregateError));
}(this, (function (AggregateError) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var AggregateError__default = /*#__PURE__*/_interopDefaultLegacy(AggregateError);

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    var CONSOLE_ENUM;
    (function (CONSOLE_ENUM) {
        CONSOLE_ENUM["error"] = "error";
        CONSOLE_ENUM["log"] = "log";
        CONSOLE_ENUM["warn"] = "warn";
    })(CONSOLE_ENUM || (CONSOLE_ENUM = {}));

    class Tapable {
        constructor(debug) {
            this.events = {};
            this.debug = debug;
        }
        on(name, callback) {
            var _a;
            if (this.events[name]) {
                (_a = this.events[name]) === null || _a === void 0 ? void 0 : _a.push(callback);
            }
            else {
                this.events[name] = [callback];
            }
        }
        emit(name, ...args) {
            var _a;
            if (this.events[name]) {
                (_a = this.events[name]) === null || _a === void 0 ? void 0 : _a.forEach(item => {
                    item(...args);
                });
            }
            else {
                this.log(`【${name}】 还没有注册`, CONSOLE_ENUM.warn);
            }
        }
        log(msg, mode = CONSOLE_ENUM.log) {
            var _a;
            if ((_a = this.debug) === null || _a === void 0 ? void 0 : _a.includes(mode)) {
                console[mode]('【FileUpload】 ' + msg);
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

    var concurrency = (iterable, mapper, { concurrency = Infinity, stopOnError = true, again = 3 } = {}) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (typeof mapper !== 'function') {
                throw new TypeError('Mapper function is required');
            }
            if (!((Number.isSafeInteger(concurrency) || concurrency === Infinity) && concurrency >= 1)) {
                // throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
                throw new TypeError(`期望 \`concurrency\` 是一个整数并且大于 0 或者是 \`Infinity\`, 得到的是： \`${concurrency}\` (${typeof concurrency})`);
            }
            const result = [];
            const errors = [];
            const iterator = iterable[Symbol.iterator]();
            let isRejected = false;
            let isIterableDone = false;
            let resolvingCount = 0;
            let currentIndex = 0;
            const next = () => {
                if (isRejected) {
                    return;
                }
                const nextItem = iterator.next();
                const index = currentIndex;
                currentIndex++;
                if (nextItem.done) {
                    isIterableDone = true;
                    if (resolvingCount === 0) {
                        if (!stopOnError && errors.length !== 0) {
                            reject(new AggregateError__default['default'](errors));
                        }
                        else {
                            resolve(result);
                        }
                    }
                    return;
                }
                resolvingCount++;
                (() => __awaiter(void 0, void 0, void 0, function* () {
                    let value = nextItem.value;
                    let again1 = again;
                    while (again1) {
                        try {
                            const element = yield value();
                            result[index] = yield mapper(element, index);
                            resolvingCount--;
                            again1 = 0;
                            next();
                        }
                        catch (error) {
                            again1--;
                            if (again1 <= 0) {
                                if (stopOnError) {
                                    isRejected = true;
                                    reject(error);
                                }
                                else {
                                    errors.push(error);
                                    resolvingCount--;
                                    next();
                                }
                            }
                        }
                    }
                }))();
            };
            for (let i = 0; i < concurrency; i++) {
                next();
                if (isIterableDone) {
                    break;
                }
            }
        });
    });

    const ONE_M = 1024 * 1024; // 1M
    class FileUpload extends Tapable {
        constructor(params) {
            super(params.debug);
            this.params = { chunkSize: 5, concurrency: 5, locale: 'zh', again: 3, debug: undefined };
            this.hash = '';
            this.hashPercentage = 0;
            this.data = [];
            this.params = Object.assign(this.params, params);
            this.params.chunkSize = this.params.chunkSize ? this.params.chunkSize * ONE_M : 5 * ONE_M;
        }
        addFile(file) {
            if (!this.params.file) {
                this.params.file = file;
            }
            else {
                this.log('已经有文件，请不要重复添加', CONSOLE_ENUM.error);
            }
        }
        startUpload() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!this.params.file) {
                        this.log('请先传入文件，在开始上传', CONSOLE_ENUM.error);
                        return;
                    }
                    const fileChunkList = this.createFileChunk(this.params.file, this.params.chunkSize);
                    this.log(`代码分块完成，分为 ${fileChunkList.length} 块`);
                    let startTime = Date.now();
                    this.hash = yield this.calculateHash(fileChunkList);
                    this.log(`hash 计算完成，耗时为: ${Date.now() - startTime} ms`);
                    const returnVerify = yield this.verifyUpload(this.params.file.name, this.hash);
                    if (returnVerify) {
                        let { shouldUpload, uploadedList } = returnVerify;
                        if (!shouldUpload) {
                            this.emit('process', 100);
                            this.emit('sucess', { status: 1 });
                            this.log('该文件已经上传过，因此秒传');
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
                        yield this.uploadChunks(uploadedList, this.params.file);
                    }
                }
                catch (error) {
                }
            });
        }
        // 上传切片，同时过滤已上传的切片
        uploadChunks(uploadedList = [], file) {
            return __awaiter(this, void 0, void 0, function* () {
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
                    .map(({ formData, index }) => this.request({
                    url: "http://localhost:3000",
                    data: formData,
                    onProgress: this.createProgressHandler(this.data[index], file),
                }));
                let result = yield concurrency(requestList, () => { }, { concurrency: this.params.concurrency, again: this.params.again });
                if (!Array.isArray(result)) {
                    this.emit('error', { status: 2, message: '上传请求报错' });
                    this.log('上传请求报错', CONSOLE_ENUM.error);
                    return;
                }
                // 之前上传的切片数量 + 本次上传的切片数量 = 所有切片数量时
                // 合并切片
                if (uploadedList.length + requestList.length === this.data.length) {
                    yield this.mergeRequest(file);
                }
            });
        }
        createFileChunk(file, size = ONE_M * 10) {
            const fileChunkList = [];
            let cur = 0;
            while (cur < file.size) {
                fileChunkList.push(file.slice(cur, cur + size));
                cur += size;
            }
            return fileChunkList;
        }
        calculateHash(fileChunkList) {
            return new Promise(resolve => {
                let worker = new Worker("/hash.js");
                worker.postMessage({ fileChunkList });
                worker.onmessage = (e) => {
                    const { hash, percent } = e.data;
                    this.emit('process', percent * 0.25);
                    if (hash) {
                        resolve(hash);
                    }
                };
            });
        }
        verifyUpload(filename, fileHash) {
            return __awaiter(this, void 0, void 0, function* () {
                let options = {
                    url: "http://localhost:3000/verify",
                    headers: {
                        "content-type": "application/json"
                    },
                    data: JSON.stringify({
                        filename,
                        fileHash
                    })
                };
                try {
                    const { data } = yield this.request(options)();
                    return JSON.parse(data);
                }
                catch (error) {
                    this.emit('error', { status: 3, message: '验证请求报错' });
                    this.log('验证请求报错', CONSOLE_ENUM.error);
                }
            });
        }
        // 用闭包保存每个 chunk 的进度数据
        createProgressHandler(item, file) {
            return (e) => {
                item.percent = parseInt(String((e.loaded / e.total) * 100));
                if (file || !this.data.length) {
                    this.emit('process', 0);
                }
                const loaded = this.data.map(item1 => item1.size * item1.percent).reduce((acc, cur) => acc + cur);
                let precent = parseInt((loaded / file.size).toFixed(2)) * 0.75 + 25;
                this.emit('process', precent);
            };
        }
        request({ url, method = "post", data, headers = {}, onProgress = () => { }, }) {
            return function () {
                return new Promise(resolve => {
                    const xhr = new XMLHttpRequest();
                    xhr.upload.onprogress = onProgress;
                    xhr.open(method, url);
                    Object.keys(headers).forEach(key => xhr.setRequestHeader(key, headers[key]));
                    xhr.send(data);
                    xhr.onload = (e) => {
                        resolve({
                            data: e.target.response
                        });
                    };
                });
            };
        }
        // 通知服务端合并切片
        mergeRequest(file) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.request({
                        url: "http://localhost:3000/merge",
                        headers: {
                            "content-type": "application/json"
                        },
                        data: JSON.stringify({
                            size: this.params.chunkSize,
                            fileHash: this.hash,
                            filename: file.name
                        })
                    })();
                    this.emit('sucess');
                }
                catch (error) {
                    this.emit('error', { status: 4, message: '合并请求报错' });
                    this.log('合并请求报错', CONSOLE_ENUM.error);
                }
            });
        }
    }

    return FileUpload;

})));
//# sourceMappingURL=index.js.map
