self.importScripts("/spark-md5.min.js"); // 导入脚本

// 生成文件 hash
self.onmessage = e => {
  const { fileChunkList } = e.data;
  const spark = new self.SparkMD5.ArrayBuffer();
  let percentage = 0;
  let count = 0;
  const loadNext = index => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(fileChunkList[index]);
    reader.onload = e => {
      count++;
      spark.append(e.target.result);
      if (count === fileChunkList.length) {
        self.postMessage({
          percent: 100,
          hash: spark.end()
        });
        self.close();
      } else {
        percentage += 100 / fileChunkList.length;
        self.postMessage({
          percent: percentage
        });
        loadNext(count);
      }
    };
  };
  loadNext(0);
};
