import { compress } from "@mongodb-js/zstd/lib/index.js";

const str = "hello".repeat(100)
console.log(Buffer.from(str).length)
console.log((await compress(Buffer.from(str))).length)
