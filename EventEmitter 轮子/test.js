const EventEmitter = require('./index.js')
const util = require("util");

function Girl() {}

// 使 Girl 继承 EventEmitter
util.inherits(Girl, EventEmitter);
// 创建 Girl 的实例
let girl = new Girl();

// // 获取事件最大监听个数
// console.log(girl.getMaxListeners()); // 10
// // 设置事件最大监听个数
// girl.setMaxListeners(2);
// console.log(girl.getMaxListeners()); // 2


// girl.on("失恋", () => console.log("哭了"));
// girl.on("失恋", () => console.log("喝酒"));
// girl.emit("失恋");

// girl.on("失恋", () => console.log("哭了"));
// girl.prependListener("失恋", () => console.log("喝酒"));
// girl.emit("失恋");


// // 设置事件最大监听个数
// girl.setMaxListeners(2);
// girl.on("失恋", () => console.log("哭了"));
// girl.on("失恋", () => console.log("喝酒"));
// girl.on("失恋", () => console.log("吸烟"));
// girl.emit("失恋");

// girl.on("失恋", () => console.log("哭了"));
// girl.once("失恋", () => console.log("喝酒"));
// girl.emit("失恋");
// girl.emit("失恋");


// let cry = () => console.log("哭了");
// let drink = () => console.log("喝酒");
// girl.on("失恋", cry);
// girl.once("失恋", drink);
// girl.on("失恋", () => console.log("吸烟"));
// girl.removeListener("失恋", cry);
// girl.removeListener("失恋", drink);
// girl.emit("失恋");

// girl.on("失恋", () => console.log("哭了"));
// girl.prependListener("失恋", () => console.log("喝酒"));
// girl.emit("失恋");

// let cry = () => console.log("哭了");
// let drink = () => console.log("喝酒");
// girl.on("失恋", cry);
// girl.once("失恋", drink);
// girl.once("失恋", () => console.log("吸烟"));
// console.log(girl.listeners("失恋"));


girl.on("失恋", () => console.log("哭了"));
girl.on("失恋", () => console.log("喝酒"));
girl.on("和好", () => console.log("开心"));
// 移除 “失恋” 类型事件监听
girl.removeAllListeners("失恋");
console.log(girl.listeners("失恋"));