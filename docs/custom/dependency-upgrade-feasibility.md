# 依赖 / Node 升级可行性评估

> 记录日期：2026-06-14　状态：**Tier 1 已落地（2026-06-14,分支 `chore/tier1-node24-pnpm9`,待 PR/CI 合并）**;Tier 2/3 待办。
> 触发：对比另两个 vanblog fork（CornWorld、xxddccaa/kevinchina）后发现工具链落后。
> 北极星不变：**性能 + Lighthouse + 保守同构上游**。据此排优先级，与那两个 fork 不同。

## 当前真实基线（已读代码核实，非臆测）

| 包 | 关键版本 | 现状 |
|---|---|---|
| 运行时 | **Node 18**（`Dockerfile` 全 4 阶段 `node:18*`）| ⚠️ **已 EOL**（2025-04 终止支持）|
| 包管理 | pnpm **8.11.0**（root `packageManager`）| 落后（现 10.x）|
| 全局 | TypeScript **4.9.5**（三包统一）| 落后（TS 5.x 已近两年）|
| server | NestJS **9.4**、mongoose **7.6** | 各落后一个大版本（现 10/11、8）|
| website | Next **13.5.6**、React 18、bytemd 1.22 | Next 落后（14/15）|
| **admin** | **umi 3.5**、**React 17**、antd **4.24** | 🔴 三层全是老大版本（祖传包袱）|

root 无 `engines` 字段 → Node 版本目前只靠 Dockerfile 隐式定。

对照：kevinchina 已 Node 24 / pnpm 10、多容器 + Postgres/Redis；CornWorld 在"全量升级依赖 + 抛 umi 重写 admin"（但 release 停在 2025-05）。

## 分档方案

### 🟢 Tier 1：运行时 / 工具链（低风险，最先做）
- **Node 18 → 20 LTS**（或 22 LTS）：改 `Dockerfile` 4 个 `FROM node:18-*` + 验证 build/runtime + CI 冒烟。Node 18 EOL，光安全维护就该升。
- **pnpm 8.11 → 9 或 10**：bump `packageManager` + 稳妥重生成 `pnpm-lock.yaml`。
- 顺手补 `engines`（root package.json）+ `.nvmrc`，把 Node 版本显式钉死。
- 风险低（单镜像 entrypoint + CI 冒烟 + tsc 兜底）、ROI 高（解 EOL + 解锁后续升级 + 缩小与他人差距）。

### 🟡 Tier 2：框架大版本（中风险，逐包推进）
- TS 4.9 → 5.x（三包；留意 server 的 NestJS 装饰器：`experimentalDecorators`）。
- server：NestJS 9→10、mongoose 7→8（少量 breaking）。
- website：Next 13.5 → 14（pages router 保留、增量升，不强制 App Router；Next 15 需 React 19，暂不追）。
- 每包独立升、各有 build+tsc 门禁，一次一个包。

### 🔴 Tier 3：admin 现代化（高工程，战略级）= umi 那条
- umi 3→4（config/routing/build 近乎重写）+ React 17→18 + antd 4→5（API + CSS-in-JS 全 breaking）。多周工程。
- 选项：(a) 原地逐层升；(b) 彻底重写抛 umi（CornWorld 路线）；(c) 维持现状。

## 本项目特有风险（任何升级都要防）
1. **lockfile / CI 敏感**：删依赖没重生成 lock → CI `--frozen-lockfile` 直接挂（[deployment-and-ci-notes](./deployment-and-ci-notes.md) 有记录）。**任何依赖改动必须同步重生成并提交 `pnpm-lock.yaml`**。
2. **单镜像连带**：Node bump 影响 `Dockerfile` 全部构建阶段，一处错全挂。
3. website 完整 build 需后端或 `isBuild=t`，本地难全验，靠 CI 冒烟门禁。

## 优先级判断（贴北极星，**与那两个 fork 不同**）
- **Tier 1 是唯一"该尽快"的** —— Node EOL 是硬伤，低风险高回报。
- **Tier 3（admin 重写）对本 fork 恰是最低优先级**：admin 是后台、**不影响读者一分 Lighthouse**。那两个 fork 重构 admin 是因为要做"自己的产品"；本 fork 做精修，umi3 虽旧但能跑、不碍北极星，无具体痛点前不值得砸多周。**别被带节奏。**
- Tier 2 纯维护性收益，按需零散推。

## 落地顺序（明天起）
1. ~~**Tier 1 单独一个 PR**：Node LTS + pnpm 升级 + `engines`/`.nvmrc` 钉版 + 重生成 lockfile → CI 冒烟验完即合。~~ ✅ **已落地（见下「Tier 1 落地记录」）。**
2. Tier 2 之后逐包零散推。
3. Tier 3 长期排期，非必要不动。

## Tier 1 落地记录（2026-06-14，分支 `chore/tier1-node24-pnpm9`）

> **决策更正（同日)：最终回落 Node 22,放弃 24。** 下文「Node → 24」的论证已作废。
> 经过:先选 24(runway 到 2028)→ CI 接连撞 Node 24 移除的 `util.isObject`:① `@nestjs/cli@9`
> 的 `nest build`(临时升 cli@11 绕过)；② 镜像能构建但运行时冒烟全 `HTTP 000`(容器起不来),
> admin 的 umi3.5/webpack4 等老栈对 Node 24 根本不友好。对照 CornWorld(把依赖全怼最新的激进 fork)
> 也钉 `.node-version=22`,印证 24 跑在生态前面。**回落 22 后:Node 仍 off-EOL(到 2027-04)、
> 整套老栈恢复可用、cli@11 一并回退成 @9(Tier 1 只剩运行时+包管理)。** Node→24 的彻底解法属 Tier 2/3。

**两项开工前待定的决策已定：**
- **Node → 24 LTS**（不是评估时写的 20）。原因：今天复核 EOL，**Node 20 已于 2026-04-30 EOL**，选 20 等于重蹈 EOL 覆辙；Node 22 是 Maintenance LTS（EOL 2027-04），Node 24 是 Active LTS（EOL 2028-04，runway 翻倍）。作者拍板取 24。
- **pnpm → 9.15.9**（不是 10）。关键事实：**pnpm 9 与 10 写的都是 lockfile 9.0**，所以无论选谁都只过一次 `6.0→9.0` 格式迁移；差别在 pnpm 10 默认**拦截依赖 build/postinstall 脚本**（需 `onlyBuiltDependencies` 白名单），会悄悄打断本仓 esbuild（Dockerfile 已有手工 `node install.js` 兜底）/ sharp / nan 原生构建。选 9 拿到锁文件现代化、不吃这颗雷；pnpm 10 留作日后带白名单的专门改动。

**改了什么：**
- `Dockerfile` 4 个构建阶段 `node:18*` → `node:24*`（ADMIN/WEBSITE/RUNNER alpine、SERVER full）；corepack 钉定 `pnpm@8.11.0` → `9.15.9`（4 阶段同步）。
- 根 `package.json`：`packageManager` → `pnpm@9.15.9`；新增 `engines`（`node>=24.0.0`、`pnpm>=9.0.0`，floor-only，本机非 24 只 WARN 不挡装）。
- 新增根 `.nvmrc` = `24`。
- 重生成 `pnpm-lock.yaml`：`lockfileVersion 6.0 → 9.0`。**3905 个解析 tarball 前后逐一比对（`packages:` 段去 peer 后缀归一化）：零增、零删、零改 → 纯格式迁移,无依赖版本漂移**（与上次 regen 顺带修漂移不同,这次干净）。
- 顺手删除遗留 `packages/{server,website}/Dockerfile`：yarn 构建（本仓 pnpm,无 yarn.lock）、失效 registry `npm.taobao.org`、硬编码上游域名 `mereith.com`、且全仓 `grep` 零引用（CI 只构建根 all-in-one `Dockerfile`）。

**验证（本机能做的）：** `pnpm install --frozen-lockfile --lockfile-only` 通过(EXIT 0、无 `ERR_PNPM_OUTDATED_LOCKFILE`)→ 锁文件与 8 个 workspace manifest 一致,CI 的 WEBSITE 阶段 frozen 装不会因 staleness 挂。

**待 PR/CI 把关（本机替代不了）：** 完整 Node 24 多阶段镜像构建 + `ci-smoke-test.sh` 起容器断言端点。**铁律:这才是 Tier 1 真正的验收;PR 开在 main 上才触发。** 本机 corepack 0.29.4（旧）`prepare` 仍复现 §3.1 的 `Cannot find matching keyid` 签名错,但镜像内 `npm i -g corepack@latest` 已规避,且本机 pnpm 9.15.9 实际可用,不影响锁文件生成。

**踩坑留痕：** 开 PR 用的 dead-Dockerfile 清理被拆成了后台任务,作者点了运行→它在工作树里删了那两个文件并 staged,结果被本次 Tier 1 提交一并扫入(commit 消息已据实改写、含该删除)。教训:同一工作树里跑后台清理任务会和当前提交抢暂存区,要么先提交当前改动、要么让清理走独立 worktree。
