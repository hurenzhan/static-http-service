const os = require('os');
const path = require("path");
const http = require("http");
const {createReadStream, readFileSync, stat} = require('fs');
const chalk = require('chalk');
const {parse} = require('url');

let address = Object.values(os.networkInterfaces()).flat().find(item => item.family === 'IPv4').address;
const template = readFileSync(path.resolve(__dirname, 'template.html'), 'utf8');

class MainServer {
  constructor(opts = {}) {
    this.port = opts.port;
    this.directory = opts.directory; // 进程执行目录
    this.address = address; // ipv4地址
    this.template = template; // 静态目录模板
  }

  // 启动
  start() {
    const server = http.createServer(this.handleRequest);
    server.listen(this.port, () => {  // 监听端口并打印信息，使用chalk添加颜色
      console.log(`${chalk.yellow('Starting up http-server, serving:')}` + this.directory);
      console.log(`  http://${this.address}:${chalk.green(this.port)}`);
      console.log(`  http://127.0.0.1:${chalk.green(this.port)}`);
    })
  }

  // 处理服务响应
  handleRequest = (req, res) => {
    let {pathname} = parse(req.url);  // 用户访问路径
    pathname = decodeURIComponent(pathname) // 解码：防止非英文目录，所以要先解码一次
    const filePath = path.join(this.directory, pathname); // 文件路径：在当前执行目录下进行查找路径

    stat(filePath, (err, stat) => {
      if (err) return this.sendError(res);  // 读取不到就会抛出异常，返回前端异常
      const isDirectory = stat.isDirectory(); // 是否文件夹
      if (!isDirectory) this.sendFile(req, res, stat, filePath);  //1.不是文件夹直接读取
    });
  }

  // 异常：找不到文件
  sendError(res) {
    res.statusCode = 404;
    res.end('NOT Found');
  }

  // 读取文件
  sendFile(req, res, stat, filePath) {
    const isCache = this.cache(req, res, stat, filePath); // 缓存：验证是否让浏览器直接读缓存
    // 走缓存
    if (isCache) {
      res.statusCode = 304
      return res.end();
    }


    createReadStream(filePath).pipe(res);
  }

  // 缓存校验
  cache(req, res, stat, filePath) {
    res.setHeader('Cache-Control', 'no-cache'); // 他表的是每次都来服务器来询问是否缓存， no-store没有缓存

    // 根据设定时间缓存
    // res.setHeader('Cache-Control','max-age=10'); // s 单位, 10s内我引用的其他资源不要在访问了
    // res.setHeader('Expires',new Date(Date.now() + 10 * 1000).toGMTString());

    // 根据修改时间缓存
    // --if-modified-since 浏览器下次访问的时候带过来的
    // --last-modified: Tue, 07 Jul 2020 03:31:44 GMT 服务器和浏览器说 此文件最后修改时间是多少
    const ifModifiedSince = req.headers['if-modified-since']
    const creatTime = stat.ctime.toGMTString();
    res.setHeader('last-modified', creatTime);
    if (ifModifiedSince !== creatTime) return false;

    // 根据最后修改时间 可能会出现时间变化后但是内容没变，或者如果1s内多次变化 也监控不到 ，缓存时间的单位是秒


    return true;
  }
}

module.exports = MainServer;