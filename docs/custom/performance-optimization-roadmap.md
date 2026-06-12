# 性能优化路线图（Lighthouse 冲刺）

> 记录日期：2026-06-11　状态：规划中，待落地
> 北极星：沿用原作者那句 **"快到极致的响应速度，Lighthouse 接近满分"**。
> 给下次会话：从这里接着干。优化对象是 `packages/website`（Next.js 13 pages router，主题 default/nova/nova-nebula）。

## 第 0 步：先测再改（强制）

拿一篇**最重的文章页**（含代码 + 数学公式 + mermaid 图 + 评论）跑 Lighthouse，
记录基线：**LCP、TBT、INP、CLS、FCP、传输的 JS 总量**。之后每项优化都对着这些数字验证。

### 实测基线（2026-06-12，URL = http://192.168.236.81/）

测试页 = `/post/11`（122KB，代码密集 hljs×199，含评论；全站 54 篇**无一篇用 mermaid**，仅 `/post/26` 用公式）。
Lighthouse 11 移动端，`--only-categories=performance`：

| 指标 | 基线值 |
|---|---|
| **Performance score** | **20** |
| FCP | 4.2 s |
| LCP | 16.2 s |
| TBT | 720 ms |
| CLS | 0.611 |
| Speed Index | 7.4 s |
| TTI | 11.2 s |
| 页面总大小 | 2,464 KiB |
| **JS 传输总量** | **1,005 KB** |

报告存于 `.perf-baseline/lh-post11.report.{html,json}`（已 gitignore，勿提交）。

### ⚠️ 基线翻盘：头号瓶颈是「第三方分析脚本」，不是 first-party 包体积

1005KB JS 里 **~588KB 是第三方**：
- gtag/GA ×3 ≈ **480KB**（一个来自 `gaAnalysisId` 配置 + `afterInteractive`；另一个 GA ID + 51.la 来自**站长后台 customScript** 注入，当前 `beforeInteractive` **阻塞渲染**；gtag 又自动拉链接的次级 tag）
- 51.la `sdk.51.la` 36KB（站长 customScript，源码无此字符串）
- 百度 hm.js 12KB（`baiduAnalysisId`）
- unpkg `@waline/client@3.0.0` 60KB（第三方 CDN）

first-party ≈ 417KB：最大 chunk `7341-*.js` 190KB（bytemd + mermaid + markdown），framework 45KB 等。

**修正后的执行优先级（按实测 ROI）**：
1. 🔴 **分析脚本全部延后**（gaAnalysis/baidu 的 `afterInteractive`→`lazyOnload`；customScript `beforeInteractive`→`lazyOnload`）——保留全部统计、零功能损失、最大 TBT/LCP 收割。原 Phase 4 升为第一。
2. 🔴 **mermaid 动态化**——全站没人用却每页白送，100% 命中（Phase 2）。
3. 🟠 **WaLine 本地化 + 懒加载**——干掉 unpkg 60KB + 渲染阻塞（Phase 3）。
4. 🟢 **删死依赖** react-syntax-highlighter / react-photo-view（Phase 1）。
5. 🔴 **CLS 0.611** 需专项治理（评论框/图片预留高度、分析脚本注入抖版）。

> 站长配置项（需作者确认，非 bug 不擅动）：后台配了 **2 个 GA ID + 51.la**（经 customScript 注入）。我只改「加载时机」不删统计；是否精简为 1 个 GA / 去掉 51.la 由作者定。

核心判断（**已被基线修正**）：服务端不慢，但客户端瓶颈**主要是第三方分析脚本的加载时机**，其次才是 first-party 包体积（mermaid/waline）。下面按性价比排。

## 高价值改动（依据 `packages/website/package.json` 依赖直接锁定）

| 优先级 | 问题 | 影响 | 改法 |
|---|---|---|---|
| 🔴 P0 | `mermaid` ^10.6 全量进包 | 单库 ~500KB–1MB+（带 d3/dagre），多数文章无图 | 动态 `import()`，仅当文章含 mermaid 代码块才加载 |
| 🔴 P0 | Waline 从 **unpkg 运行时加载**（`components/WaLine/core.tsx`）| 第三方 DNS/连接 + 渲染阻塞 CSS；且版本错配（dep `@waline/client`^3.13，unpkg 钉 3.0）| 改用**已装的本地 `@waline/client`** 打包；并**滚动到评论区(IntersectionObserver)再懒加载**（评论在首屏下方）|
| 🟠 P1 | `bytemd` 全家桶疑似进了**前台渲染** | bytemd 是**编辑器**，前台只需渲染器，编辑器进包是巨大浪费 | 确认 `components/Markdown` 是否用 bytemd viewer；若是，换纯 remark/rehype 渲染（已装 remark-gfm/remark-rehype/rehype-raw/remark-directive）|
| 🟠 P1 | `react-syntax-highlighter` 与 `@bytemd/plugin-highlight-ssr` 可能**重复** | 客户端高亮器很大（prismjs + 语言包）| 二选一，**优先 SSR 高亮**，客户端不再 ship 高亮器 |
| 🟡 P2 | `katex` ^0.16 + 字体 | ~270KB + 字体，仅数学文章需要 | 仅含公式页加载；katex 字体勿渲染阻塞 |
| 🟡 P2 | `largePageDataBytes: 1024*1024*10`（next.config.js）| 信号：pageProps 可能巨大（整篇内容/全量数据塞进 HTML+JSON），拖慢 FCP/LCP/水合 | 查 getStaticProps/getServerSideProps 传了啥，瘦身 props |
| 🟡 P2 | `lodash` ^4.x 整包导入 | 若 `import _ from 'lodash'` ship ~70KB | 改 `lodash-es` 按需导入或换原生 |

## 非依赖类稳赚项
- **字体**：自托管 + `font-display: swap` + preload 首屏字体（Web 字体是 LCP/CLS 经典杀手）。
- **LCP 图片**：首屏图 `next/image` 加 `priority`，其余懒加载；底子已有 `sharp` + webp + CDN(`assetPrefix`/`VAN_BLOG_CDN_URL`)。
- **Caddy 层**：确认开 **Brotli**、静态资源 `immutable` 长缓存、HTTP/2/3（白嫖分）。
- **CLS**：给评论框/图片预留高度，避免 Waline 注入时跳版（`core.tsx` 的 `#waline` 容器）。

## 建议的落地顺序
1. **P0-A：Waline 本地化 + 懒加载**（代码最熟，刚改过 `core.tsx`；纯体积收割，低风险）。
2. **P0-B：mermaid 动态化**（先看 `components/Markdown` 渲染方式再下手）。
3. 再做 P1（bytemd 渲染器瘦身 / 高亮去重）——这块是最大体积来源，但要先摸清渲染链路。
4. 最后 P2 + 非依赖项收尾，每步重测 Lighthouse。

## 下次开工前要先核实（Open Questions）
- `packages/website/components/Markdown` 到底用 bytemd viewer 还是 remark/rehype 管线？（决定 P1 改法）
- 文章页 LCP 元素是什么？pageProps 实际多大？（验证 `largePageDataBytes` 是否真有问题）
- 字体如何加载（Google Fonts 外链 / 自托管）？
- 是否有其他第三方脚本（统计/分析）拖累 TBT？
- 线上部署 URL（跑基线用）。

## 相关已知背景
见同目录 [deployment-and-ci-notes.md](./deployment-and-ci-notes.md)：Waline 当前实现、镜像/CI、脚本部署等。
