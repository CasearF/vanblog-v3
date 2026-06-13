# Fork 路线对比与后续借鉴清单

> 记录日期：2026-06-12
> 给后续会话：评估过另一个活跃 fork（CornWorld）后的结论与可借鉴项。**结论：保持自己的 fork，选择性偷师。**

## 1. 三个 fork 的定位

| | 原作者 Mereithhh/vanblog | **本仓库 CasearF/vanblog-v3** | CornWorld/vanblog |
|---|---|---|---|
| 状态 | 已停更（2025-06 最后 push） | 本周活跃维护 | 停更约 4 个月（2026-02-03 最后 push）|
| 定位 | 原版 | **保守维护：修 bug + 加功能，与上游同构** | 深度重构 "totally refactoring" |
| 后端 | NestJS + MongoDB(mongoose) | 同上游 NestJS + MongoDB | 新建 `server-ng`：NestJS + **drizzle-orm**(换关系型) + **ts-rest** + zod |
| 工程链 | 原版 | 原工具链 + 本周新增 CI 冒烟测试 | pnpm10 + husky + nano-staged + eslint flat + vitest 单测 + E2E + JUnit 上报 |
| 额外包 | — | `themes/`(主题系统) | `shared`、`server-ng`、`cli` |
| star | 3.5k | 16(本仓库无关紧要) | 16 |

## 2. 为什么不切换到 CornWorld（结论）

1. **数据层不兼容**：CornWorld 正把存储从 MongoDB 迁到 drizzle(关系型)。本项目线上(192.168.236.81)跑 Mongo，
   且刚完成 WaLine 评论数据导入。切过去 = 数据迁移 + 重踩坑，作废本周全部成果。
2. **它本身是半成品重构且已停更**：`server-ng` 注释显示 2025-12 才迁完 Logger，仍在迁移中；停更 4 个月。
3. **路线哲学冲突**：本项目北极星 = 保守维护 + 性能极致；CornWorld = 推翻重写。不可融合。

## 3. 值得借鉴的点（摘过来，不切仓库）——按性价比

1. **`shared` 包共享类型** ⭐ 最值得做。把前后端共用的 DTO/响应类型抽到一个 pnpm workspace 包，
   消灭"改了 server 返回结构忘了同步 website/admin"类 bug。
   → 本周 WaLine 评论格式错配（v3 客户端 vs 旧裸格式）本质就是缺这层契约。中等工作量，长期收益大。
2. **husky + nano-staged 提交前钩子**：commit 前自动 lint/format，挡低级错误进库。半小时配好，零风险。
3. **vitest 单测起步**：CornWorld 给 tag/analytics/插件写了单测。本项目目前只有端到端冒烟测试，
   可挑核心 provider（waline env 拼装、setting）补几个单测，与冒烟形成上下两层防线。

**不抄**：drizzle / ts-rest / server-ng 整套 —— 那是换地基，不是装修。

## 4. 当前未完成的工作线（下次可接续，按优先级）

1. ~~**性能优化 Option A（唯一确认能上分的方向）**：去掉 bytemd `<Viewer>` 客户端二次水合，
   改静态渲染 SSR 产出的 HTML（viewerEffect 改轻量原生 JS）。~~ ✅ **代码已实现并过 tsc/lint/ecc review**
   （2026-06-13，见 [performance-optimization-roadmap.md](./performance-optimization-roadmap.md) §第二批）。
   ⏳ **未做真机 Lighthouse 实测**（铁律：估算不算数，须 `/post/11` 改动前后各跑一次对比，见该节「上线后必验」）。
2. ~~**借鉴项 #1：`shared` 共享类型包**~~ ✅ **已落地 v1**（2026-06-12，见第 5 节 + `packages/shared/README.md`）。
   **后续可深化**：(a) server 各 controller 把返回逐步标注成 `ApiResponse<T>` / `Article`
   （当前 server 只共用了 `SortOrder`，是 pass-through 弱耦合，真正的强制只发生在被约束的用点）；
   (b) admin 接入（它的 API 类型多由 `umi openapi` 生成，需另行评估）；(c) 把
   `pnpm --filter @vanblog/shared run check` 接进 CI（因消费方 `skipLibCheck` 不校验 .d.ts 自身）。
3. **借鉴项 #2/#3**：husky 提交钩子、核心 provider 单测。
4. ~~原作者 TODO 里小甜点：快捷分享按钮~~ ✅ **已落地**（2026-06-13，见第 5 节）。

## 5. 本周已完成（截至 2026-06-13）

- WaLine 评论系统 P0 全链路修复（见 [deployment-and-ci-notes.md](./deployment-and-ci-notes.md) 第 6 节）。
- CI 构建后冒烟测试落地（`scripts/ci-smoke-test.sh` + workflow，通过才推镜像）。
- README 标注 Casear 维护身份，勾选两项已完成 TODO（主题系统、e2e/CI）。
- 性能第一批改动（分析脚本 lazyOnload + mermaid 动态化）已部署，但实测基本无效（见性能路线图）。
- **`shared` 共享类型包 v1**（`packages/shared`，declaration-only `.d.ts`，详见 `packages/shared/README.md`）：
  - 新增 `@vanblog/shared`，导出 `SortOrder` / `ApiResponse<T>` / `Article` / `ArticleListResponse` / `PaginationOption`。
  - **接线机制刻意选了 tsconfig path alias + `import type`，没用 workspace:* 依赖、也没改造 Docker 各 stage 为 workspace 感知**
    （那会重写 server/admin 的 node_modules/dist COPY 路径，且本地无 Docker 难验证）。
    每个 builder stage 只多 1 行 `COPY ./packages/shared`（server→`/shared`，website→`/app/packages/shared`，
    alias `../shared/src/index.d.ts` 在本地与两种 Docker 布局下都成立）。
  - server `types/sort.ts` re-export 共享 `SortOrder`（5 处引用零改动）；website `types/article.ts` re-export 共享 `Article`、
    `api/getArticles.ts` 用 `ApiResponse<ArticleListResponse>` 标注返回。
  - **验证**：server + website `tsc --noEmit` 均过；`pnpm install --frozen-lockfile` 一致（8 个 workspace 项目）；
    实测改共享返回结构会让 website 编译报错（见 README 自检节）。
  - **lockfile 副作用（已知、无害）**：重生成 `pnpm-lock.yaml` 时顺带修正了既有漂移
    `@waline/vercel ^1.31.7→^1.39.3`（waline/package.json 早已是 1.39.3，只是 lock 没跟上）+ `think-helper 1.1.4→1.1.5`。
    waline 在 RUNNER 阶段独立 `pnpm i`、website frozen 阶段不依赖它，故对 Docker/运行时无影响。
- **文章快捷分享按钮**（2026-06-13，借鉴清单第 3/4 节小甜点收尾）：
  - 新增 `components/ShareBar/index.tsx`（纯展示）+ `utils/shareLinks.ts`（`buildShareLink` 纯函数，配 5 条 vitest 单测 `__tests__/shareLinks.spec.ts`）。
  - 文章正文末尾一行：复制链接（`copy-to-clipboard` + `react-hot-toast` toast）/ 微博 / QQ空间 / X / Telegram（`window.open` 各家分享 intent）+ 移动端系统分享（`navigator.share`，特性探测、挂载后才显示，避免 SSR 水合不一致）。
  - 三套 PostCard（`components/PostCard` default + `themes/nova` / `themes/nova-nebula` 的 `NovaPostCard`）全接，`type==="article" && !lock` 才渲染。**零新依赖**，沿用既有库。
  - **两个易踩点记死**：(a) tailwind `content` 只扫 `./components` 与 `./pages`——任意值 hover 颜色类名（`hover:text-[#e6162d]` 等）必须写在组件文件里才会被生成，塞进 `utils/` 或 `themes/` 都不会被扫到；(b) 暗色描边别用 `nav-dark`(#26282c)——它与文章卡片 `dark:bg-dark`(#26282c) 同色会让药丸边框在暗色模式下完全消失，改用 `gray-600`(#4b5563)。
  - **验证**：website `tsc --noEmit` 通过；`shareLinks.spec.ts` 5/5 绿。完整构建验证走 CI（build + 冒烟门禁），最终观感以部署后实测为准。
- **性能 Option A：去 bytemd 客户端水合**（2026-06-13，代码完成、⏳ 待真机 Lighthouse 实测）：
  文章/列表/about 正文改为服务端 `getStaticProps` 预渲染 HTML + 客户端 `StaticMarkdown` 静态注入（复制/锚点/缩放用原生事件补回），
  bytemd 仅加密文章解锁 / mermaid 经 `next/dynamic` 懒加载兜底 → 文章页主 chunk 零静态 bytemd。
  新增 `utils/markdownToHtml.ts`(`renderStaticHtml`) / `utils/displayContent.ts` / `components/Markdown/{StaticMarkdown,ClientMarkdown,staticBehaviors}`。
  tsc + lint + ecc(react+ts)review 已过。**收益必须以真机 Lighthouse 为准**，详见 [performance-optimization-roadmap.md](./performance-optimization-roadmap.md) §第二批。
