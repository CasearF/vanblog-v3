/**
 * 跨包通用类型契约。
 *
 * 这些类型同时被 server（产出方）与 website（消费方）引用，
 * 改了任意一处都会让另一侧的类型检查失败 —— 这正是本包存在的意义：
 * 把"改了 server 返回结构忘了同步前端"那类 bug 提前到编译期暴露。
 */

/** 列表排序方向。server `types/sort.ts` 与 website 文章查询共用。 */
export type SortOrder = 'asc' | 'desc';

/**
 * VanBlog 后端统一响应信封。
 *
 * 后端各 controller 目前手写 `{ statusCode, data }` 返回；前端各 api 文件
 * 统一 `const { statusCode, data } = await res.json()` 解构。此类型把这层隐式
 * 契约显式化。`statusCode` 约定：200 成功、233 未初始化（前端据此回落默认值）。
 */
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message?: string;
}

/** 分页查询的通用入参片段。 */
export interface PaginationOption {
  page: number;
  pageSize: number;
}
