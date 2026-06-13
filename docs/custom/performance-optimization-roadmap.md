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

### 第一批实测结果（2026-06-12，commit 996ed90，已部署上线）

改动：分析脚本全部 `lazyOnload`（gaAnalysis/BaiduAnalysis/CustomLayout）+ mermaid 动态拆分（新增 `Markdown/plugins.tsx`、`Markdown/MermaidViewer.tsx`）。
（死依赖 react-syntax-highlighter 删除**已回退**：会与 `pnpm-lock.yaml` 不同步导致 CI `--frozen-lockfile` 失败，且它本就没被 import、删了零收益。留待之后单独跑 `pnpm install` 更新 lock 再删。）

| 指标 | 基线 → 第一批后 |
|---|---|
| Performance | 20 → 19（噪声）|
| LCP | 16.2s → 13.8s（小幅真改善）|
| TBT | 720ms → 770ms（**没动**）|
| CLS | 0.611 → 0.611（没碰）|
| JS 传输 | 1005KB → 981KB（**仅 -24KB**）|

**结论：基本无效。两次打脸，教训写死在这里：**

1. **mermaid 拆分 ≈ 无效**：前后对比最大 chunk `7341`(190KB) → `646`(189KB) **几乎没变**。那 190KB 不是 mermaid，是 **bytemd 核心 + highlight + katex**。mermaid 本就没进非流程图页面的包。ECC agent 估的"每页 600-900KB mermaid"是未压缩值 + 判断错加载方式 → **整条作废**。（代码无害且保留了功能，未撤回。）
2. **分析脚本 `lazyOnload` ≈ 无效**：lazyOnload 只改"何时执行"，脚本**仍在 Lighthouse 测量窗内被下载**（所以 JS 没少）；且 GA 原本就是 `afterInteractive`、本就不太阻塞主线程 → TBT 自然不动。

**真正的瓶颈（实测 chunk 读出来的）**：
- 🔴 **bytemd `<Viewer>` 客户端二次水合**：文章 HTML 服务端已渲染好（highlight 用的是 SSR 版），但浏览器里 `@bytemd/react <Viewer>` **又把整篇 markdown 重新解析 + 重新高亮**（post/11 有 199 个代码块）→ **这才是 TBT 720ms 的真凶 + 189KB 可省 chunk**。
- 🟠 GA gtag 160KB（配置的那个，仍下载）、unpkg waline 60KB（未碰）、🔴 CLS 0.611（未碰）。

**下一步唯一真能上分的方向（= 原先被低估为"高风险"那条，现确认是正解，对应 Option A）**：
**去掉 bytemd 客户端水合，改为静态渲染 SSR 产出的 HTML**（把复制按钮 / 图片缩放 / 标题锚点 / mermaid 等 `viewerEffect` 改成轻量原生 JS 挂到静态 DOM 上）。直接干掉 189KB chunk + 水合 TBT。之后再配合 WaLine 本地化+懒加载、CLS 治理。

> **铁律强化**：本项目任何"体积/性能估算"（包括 ECC agent 的）一律**不可信**，必须 `build → 部署 → Lighthouse 实测`才算数。第 0 步基线 + 第一批实测两次推翻了估算结论。

核心判断（**已二次修正**）：真正瓶颈是 **bytemd 客户端水合（吃 TBT）**，不是第三方分析脚本、也不是 mermaid。下方原始"高价值改动"表中 mermaid/highlight 相关行已部分作废，**以本节为准**。下面表格仅作历史参考。

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

## 第二批：Option A 去 bytemd 客户端水合（2026-06-13 实现完成，待真机 Lighthouse 实测）

> 第一批两次打脸后确认的「唯一真能上分」方向。**实现 + tsc/lint/ecc(react+ts)review 已过，但本项目铁律=估算不算数：最终 Performance/TBT 收益必须以 `/post/11` 改动前后各跑一次真机 Lighthouse 为准。部署实测前本节不写任何分数。**

### 改了什么（架构）
- 文章正文 markdown→HTML 从「客户端 bytemd `<Viewer>` 二次 `processSync` 水合」改为「服务端 `getStaticProps` 预渲染 HTML + 客户端静态注入」。
- 新增 `utils/markdownToHtml.ts`（`renderStaticHtml`，服务端；与 `<Viewer>` 同一 `getProcessor + buildPlugins + sanitize` 管线 → HTML 逐字节一致）。
- 新增 `components/Markdown/StaticMarkdown.tsx`（`dangerouslySetInnerHTML` + `useEffect` 挂轻量原生行为）+ `staticBehaviors.ts`（复制按钮 / 标题锚点 / medium-zoom，零 bytemd 依赖）。
- `components/Markdown/index.tsx` 改为派发器：有预渲染 `html` → StaticMarkdown（客户端零 bytemd）；无 → `next/dynamic` 懒加载 `ClientMarkdown`（原 Viewer 逻辑）兜底，仅加密文章解锁 / mermaid 才下载 bytemd chunk。
- 数据层 `utils/getPageProps.ts` 给 article（全文）/ about / 列表摘要预渲染 `html`；摘要逻辑抽到 `utils/displayContent.ts`；about 捐赠表拼接从客户端 `useMemo` 移到服务端。
- `katex.min.css` 从 `plugins.tsx` 移到 `_app.tsx` 全局（StaticMarkdown 不再 import plugins，公式样式须全局保住）。

### 为什么这条能上分（架构层面，非实测）
- 静态分析确认：文章页主 chunk **零静态 bytemd 引用**；bytemd（核心 + highlight.js + katex 渲染端，第一批实测 = 189KB chunk）只在 `dynamic(() => import("./ClientMarkdown"))` 的异步 chunk 里，公开非 mermaid 文章永不下载。
- 客户端不再对 199 个代码块重新解析 + 重高亮 → 直接消掉第一批定位的 TBT 720ms 真凶。

### 覆盖与不回归（逐项核对）
- **三套主题**：实测 `NovaPostCard`/`NovaArticleCard` **运行时从不渲染**（`Layout` 只换 NavBar/LayoutBody/Footer，`themes/ThemeContext` 的 `useThemeComponents` 零消费者），文章/列表/about 永远走默认 `components/PostCard` → 改默认 PostCard 即全覆盖。
- **加密文章**：content 客户端解锁后才到 → 无预渲染 html → 自动回退 ClientMarkdown 客户端渲染。
- **mermaid**：服务端出不了图 → `renderStaticHtml` 检测到 mermaid 返回 undefined → 回退 ClientMarkdown（全站 0 篇用 mermaid，零影响）。
- **渲染外观**：HTML 同管线产出、逐字节一致；代码高亮 / 公式 / 表格 / 脚注 / 容器 / 锚点 / 图片缩放 / 复制按钮全保留。
- **SEO / 结构化数据 / 阅读量 / WaLine / 分享 / 文章反应**：均在 Markdown 组件之外，不受影响。
- **安全**：`dangerouslySetInnerHTML` 姿态与原 `<Viewer>` 逐字相同（同 sanitize、同注入），无新增 XSS 面。

### payload 取舍（已知，待实测）
- 预渲染 html 作 prop 进 `__NEXT_DATA__`，与 SSR DOM 重复；markdown 源串仍要留给 Toc/hasToc。净传输量可能持平甚至略增，但 Lighthouse 大头是 TBT/TTI（JS 解析执行）。若实测 JSON 涨太多，再进「C 档」：Toc 服务端预算、文章页不 ship markdown 源串。

### ⚠️ ecc review 误报留痕（核实后判为非问题，免得下次重复纠结）
- ts-reviewer 报「dangerouslySetInnerHTML 新增 XSS」：**错**。已读 `@bytemd/react` 源码，旧 `<Viewer>` 本就用 `dangerouslySetInnerHTML` + 同一 `getProcessor({sanitize})`，姿态逐字相同，零新增面。
- react-reviewer 报「overview 显示全文」：**错**。漏看 `attachOverviewHtml` —— 列表卡的 `html` 是 `overviewMarkdown()` 摘要、非全文。
- react-reviewer 报「锚点缺 preventDefault 双滚动」：是逐字复制旧 Viewer 行为（不回归优先）；且 rehype-sanitize 默认 `clobberPrefix:"user-content-"`，原始 `#foo` 原生跳转无匹配元素=no-op，实际不双滚。

### 踩坑：getStaticProps props 不能含 `undefined`（CI 首推被 build 卡住）
- 首版 `renderStaticHtml` 在「内容空 / mermaid / 异常」时返回 `undefined`，被直接塞进 props（`about.html` / `article.html` / 列表 `html`）。
- `next build` 预渲染 `/about` 时报 **`Error serializing .about.html ... undefined cannot be serialized as JSON. Please use null or omit`**。Next.js 硬性禁止 getStaticProps 返回的 props 里出现 `undefined`（CI 无后端 → about 内容空 → 命中）。
- 修复：`renderStaticHtml` 改返回 **`string | null`**；相关类型放宽到 `string \| null`；`getPostPagesProps` 用**条件展开**（文章不存在时不写 `article` 键，绝不写 `article: undefined`，否则同样炸且会把 404 退化成 500）。
- 本地 `next build` 还会在最后 `output:"standalone"` 的 `copyTracedFiles` 报 `EPERM symlink` —— 那是 **Windows 建符号链接的权限限制**（需开发者模式/管理员），**与代码无关、CI(Linux) 不会遇到**，prerender 阶段已全过即说明业务代码 OK。

### 上线后必验（live-verify，铁律）
1. `/post/11`（最重页）改动前后各跑一次 Lighthouse 11 移动端 `--only-categories=performance`，记录 Performance / LCP / TBT / TTI / CLS / JS 传输量对比。
2. DevTools Network 确认 bytemd chunk 从文章页消失（仅解锁加密文章 / 含 mermaid 时才加载）。
3. 逐项验不回归：代码高亮 / 复制按钮 / 数学公式 / 表格 / 脚注 / 自定义容器 / 图片点击缩放 / 标题点击改 hash / 正文 `#` 锚点跳转。
4. 验加密文章解锁后正文正常渲染（走 ClientMarkdown 兜底）。
5. about 页捐赠表、列表页摘要显示正常。

## 相关已知背景
见同目录 [deployment-and-ci-notes.md](./deployment-and-ci-notes.md)：Waline 当前实现、镜像/CI、脚本部署等。
