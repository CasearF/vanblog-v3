// Article 的唯一定义在 @vanblog/shared，前后端共用同一份契约。
// 这里 re-export 以保持 `../types/article` 这个导入路径不变（十余处引用无需改动）。
export type { Article } from "@vanblog/shared";
