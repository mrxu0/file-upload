# 介绍
这是一个使用 ts 写的文件断点续传的项目，可以控制每次请求的数量，文件分块的大小，失败了重复的次数

## 打包

- npm i
- npm run build


## 调试

- npm i
- npm run dev

可以配合 examples 下面的例子结合使用


## 使用方式

```js
let fileUpload = new FileUpload(options); // 初始化
// 添加文件
fileUpload.addFile(<file>);
// 开始上传
fileUpload.startUpload()
// 订阅文件上传进度
fileUpload.on('process', (obj) => {
    console.log(obj)
})
// 订阅文件上传成功
fileUpload.on('sucess', (obj) => {
    // status 含义如下：
    // 1： 服务器文件已存在，秒传
    // 2：服务器存在部分文件
    // 3：是一个新文件
    console.log(obj)
})
// 订阅文件上传失败
fileUpload.on('error', (obj) => {
    // status 含义如下：
    // 1:  hash 计算出错，可能原因项目根目录没有加入 hash.js 和 spark-md5.min.js 文件
    // 2：上传接口上传次数超过指定次数还未上传上去，可能原因检测服务器是否正常
    // 3： 验证接口报错
    // 4： 合并接口报错
    console.log(obj)
})
```
### options

| 参数 | 类型 | 默认值 | 描述 |
|------|------------|------------|------------|
| concurrency  | Number| 5   |  并发请求数量|
| chunkSize  | Number        | 20（单位 M）|  块大小         |
| again  | Number       | 3       |  失败了的重复次数         |
| debug  | Array 或 undefined       | undefined       |  error: 打印 error 类型的提示<br/> warn: 打印 warn 类型的提示 <br/> log: 打印 log 类型的提示 <br/> undefined: 什么提示都没有         |
| file | File | 无 | 要上传的文件


