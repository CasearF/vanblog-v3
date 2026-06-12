/**
 * @vanblog/shared —— 前后端共享类型契约的统一入口（barrel）。
 *
 * 用法：消费方在自己的 tsconfig.json `paths` 里把 `@vanblog/shared` 映射到
 * 本包的 `src/index.d.ts`，并一律用 `import type { ... } from '@vanblog/shared'`。
 * 本包**只含类型**（interface / type，无 class / const / 运行时代码），
 * 因此构建期会被完全擦除，不产生任何运行时依赖，也无需打包/安装为 node 模块。
 */
export type { SortOrder, ApiResponse, PaginationOption } from './common';
export type { Article, ArticleListResponse } from './article';
