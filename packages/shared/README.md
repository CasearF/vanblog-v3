# @vanblog/shared

前后端共享的**类型契约**包。目标：把"改了 `server` 返回结构、忘了同步 `website`/`admin`"
那一类靠运行时才暴露的 bug，提前到**编译期**报错。

## 设计原则

- **只含类型，且直接以 `.d.ts` 声明文件编写**（`src/*.d.ts`）：仅 `interface` / `type`，
  **没有** class / const / enum / 任何运行时代码。因此被消费方 `import type` 引用后会在
  构建期被完全擦除，**不产生运行时依赖**，也**无需打包或安装为 node 模块、无需构建步骤**。
  > 用 `.d.ts` 而非 `.ts` 是关键：消费方 tsconfig 都开了 `composite: true`（根 `tsconfig.json`
  > 用 project references 串起 admin/website/server），`.ts` 源文件被 import 进来会触发
  > `TS6059 (not under rootDir)` / `TS6307 (not listed in file list)`；而 `.d.ts` 声明文件
  > 不受 `rootDir`/file-list 约束，干净绕过。
- **消费方式 = tsconfig path alias，而非 npm 依赖**。各消费包在自己的
  `tsconfig.json` 的 `compilerOptions.paths` 里加：

  ```jsonc
  "paths": {
    "@vanblog/shared": ["../shared/src/index.d.ts"]
  }
  ```

  并一律使用 `import type { Foo } from '@vanblog/shared'`。

## 为什么不用 workspace:* 依赖 / 不打包 dist

本仓库的 Docker 构建是**逐包隔离**的（见 `Dockerfile`）：`server`/`admin` 在各自
单包目录里跑 `pnpm i`（无 workspace 上下文），`website` 虽是 workspace 感知但只 COPY
自己那个包。在这种结构里引入 `workspace:*` 依赖会触发 `workspace: protocol can only be
used inside a workspace` 之类的问题，且需要重写 server/admin 阶段的 node_modules / dist
COPY 路径，风险高且本地无 Docker 难以验证。

改用 **path alias + 纯类型**后：

- Docker 每个构建阶段只需多 `COPY` 一份 `packages/shared`（server 落到 `/shared`，
  website 落到 `/app/packages/shared`，alias `../shared/src/index.d.ts` 在本地与两种 Docker
  布局下都成立）；
- **不动 `pnpm-lock.yaml` 的消费方依赖**（消费方 package.json 不新增 dependency），
  规避了 `--frozen-lockfile` 踩坑；
- `nest build`（底层 tsc）与 `next build`（SWC + tsc 类型检查）都按 tsconfig `paths`
  解析类型，type-only 引用在 emit 时消失，无运行时副作用。

> 后续若要升级为正式可发布的包（workspace:* + dist 产物），需要先把 server/admin
> 的 Docker 阶段改造成 workspace 感知，再加 `tsc` 构建步骤。当前阶段刻意不做。

## 当前导出（v1）

| 类型 | 含义 | server 侧 | website 侧 |
|---|---|---|---|
| `SortOrder` | 列表排序方向 `'asc' \| 'desc'` | `src/types/sort.ts` re-export | `api/getArticles.ts` |
| `ApiResponse<T>` | 后端统一 `{ statusCode, data, message? }` 信封 | （可逐步采纳） | api 解构返回值 |
| `Article` | 公开文章展示结构 | （可逐步采纳） | `types/article.ts` re-export |
| `ArticleListResponse` | `GET /api/public/article` 分页返回 | （可逐步采纳） | `api/getArticles.ts` |
| `PaginationOption` | `{ page, pageSize }` 分页入参片段 | — | — |

新增共享类型时：放进 `src/` 下对应 `.d.ts` 文件 → 在 `src/index.d.ts` 用 `export type`
透出 → 消费方 `import type`。

## 自检（重要）

消费方都开了 `skipLibCheck: true`，这意味着 **`.d.ts` 内部自身的类型错误不会在
website/server 构建时被报出来**（只有"消费方用错了某个共享类型"这种**用点（use-site）**
不匹配才会在构建时暴露 —— 这已是本包的核心价值，见下方实测）。因此改完本包后，请单独跑：

```bash
pnpm --filter @vanblog/shared run check   # = tsc --noEmit -p tsconfig.json
```

来校验本包自身的类型完整性。可考虑后续把它接进 CI（`scripts/ci-smoke-test.sh` 之前）。

> **实测（2026-06-12）**：把 `ArticleListResponse.totalWordCount` 从可选改为必填后，
> `website/api/getArticles.ts` 的 catch 分支 `return { articles: [], total: 0 }` 立刻报
> `TS2741: Property 'totalWordCount' is missing` —— 证明"改了共享返回结构、前端没跟上"
> 这类漂移会在编译期被抓住。
