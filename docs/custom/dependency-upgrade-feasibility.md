# 依赖 / Node 升级可行性评估

> 记录日期：2026-06-14　状态：评估完成，待落地（明天接着干）
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
1. **Tier 1 单独一个 PR**：Node 20 LTS + pnpm 升级 + `engines`/`.nvmrc` 钉版 + 重生成 lockfile → CI 冒烟验完即合。
2. Tier 2 之后逐包零散推。
3. Tier 3 长期排期，非必要不动。

> 开工前待定（明天确认）：Node 选 **20 还是 22 LTS**；pnpm 选 **9 还是 10**；lockfile 重生成方式（`pnpm install` 后 diff 审一遍再提）。
