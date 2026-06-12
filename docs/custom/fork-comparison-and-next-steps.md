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

1. **性能优化 Option A（唯一确认能上分的方向）**：去掉 bytemd `<Viewer>` 客户端二次水合，
   改静态渲染 SSR 产出的 HTML（viewerEffect 改轻量原生 JS）。详见
   [performance-optimization-roadmap.md](./performance-optimization-roadmap.md) 第一批实测结果一节。
2. **借鉴项 #1：`shared` 共享类型包**（见上）。
3. **借鉴项 #2/#3**：husky 提交钩子、核心 provider 单测。
4. 原作者 TODO 里小甜点：快捷分享按钮（纯前端，轻量实现，1-2h）。

## 5. 本周已完成（截至 2026-06-12）

- WaLine 评论系统 P0 全链路修复（见 [deployment-and-ci-notes.md](./deployment-and-ci-notes.md) 第 6 节）。
- CI 构建后冒烟测试落地（`scripts/ci-smoke-test.sh` + workflow，通过才推镜像）。
- README 标注 Casear 维护身份，勾选两项已完成 TODO（主题系统、e2e/CI）。
- 性能第一批改动（分析脚本 lazyOnload + mermaid 动态化）已部署，但实测基本无效（见性能路线图）。
