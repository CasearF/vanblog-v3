// SortOrder 的唯一定义在 @vanblog/shared，前后端共用同一份契约。
// 这里 re-export 以保持 `src/types/sort` 这个导入路径不变（5 处引用无需改动）。
export type { SortOrder } from '@vanblog/shared';
