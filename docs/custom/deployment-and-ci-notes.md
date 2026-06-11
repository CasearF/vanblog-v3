# 部署、CI 与安装脚本记录（fork: CasearF/vanblog-v3）

> 记录日期：2026-06-11
> 给后续 Claude 会话快速读取本 fork 的部署/构建/脚本关键信息，避免重复踩坑。

## 0. 仓库与协作约定

- 本仓库是 van-blog（原作者 mereithhh，MIT）的 fork：**CasearF/vanblog-v3**。
- git remote 名为 `vanblog-v3`（`https://github.com/CasearF/vanblog-v3.git`），默认分支 `main`。
- 仓库**已设为 public**（2026-06-11 由作者改公开）→ raw.githubusercontent / jsDelivr / GitHub API 匿名可访问。
- 协作习惯：基础设施/脚本类改动**直接提交到 main 并推送**；功能修复可走 PR。
- 自建镜像：Docker Hub **`casearxx/vanblog-v3`**（CI 自动构建推送）。

## 1. 环境/工具现状（重要）

- **没有 `gh` CLI**，**GitHub MCP 未连接**（无 token）→ 无法程序化创建 PR。
  做法：push 分支后用 `pull/new/<branch>` 链接让作者手动开 PR，或直接提交 main。
- 存在 **ECC GateGuard hook**：每个文件首次 Bash/Edit/Write 前会要求"先陈述事实"。
  按格式回答后**重试同一操作**即可通过。可用 `ECC_GATEGUARD=off` 或 `ECC_DISABLED_HOOKS` 关闭。
- 类型检查：`packages/server` 与 `packages/website` 均可 `npx tsc --noEmit -p tsconfig.json` 单独跑。

## 2. 已修复的代码 Bug（评论/进程，PR #1 已并入 main，commit caa5115）

### 前端 WaLine（`packages/website/components/WaLine/`）
- `core.tsx`：删除会把 `window.__walineInit__` 误写成 `undefined` 的 fallback 脚本；
  改为**轮询等待 ESM 就绪**（250ms×40，≤10s）再 init；`useEffect` 增加 cleanup
  （clearInterval/clearTimeout + 实例 `destroy()`）；CSS/JS 用模块级 flag 只注入一次。
- `index.tsx`：`dynamic()` 提到**模块顶层**（原在 render 内导致每次渲染重建组件、强制重挂）。
- 根因：原实现单次 500ms 超时无重试 + fallback 竞态 → "评论时有时无"。

### 后端 Provider（`packages/server/src/provider/{waline,website}/`）
- `waline stop()`：改回**进程组负 PID** 杀进程（`process.kill(-pid)`，因 `detached:true`），
  避免子孙进程残留占用 **8360** 端口导致重启 `EADDRINUSE`。
- `website restore()`：崩溃自动重启加入**指数退避 + 连崩 5 次上限**，避免启动即崩的紧密循环。
- 两个 provider 的 `exit` 处理器加 `this.ctx === child` 守卫，避免旧进程延迟退出清掉新进程引用。
- `waline run()` 去递归分支；`mapConfig2Env` 参数改名避免遮蔽模块级 `config` import，
  `otherConfig` 解析失败改为 `logger.warn` 而非静默吞掉。

## 3. Docker 构建修复

### 3.1 corepack 签名校验失败（Dockerfile，已修，commit cc9e636）
- 症状：buildx 在 `corepack prepare pnpm@latest` 后首个 pnpm 命令报
  `Cannot find matching keyid`（buildx 摘要里显示为后续的 `pnpm config set` 行）。
- 根因：`node:18` 自带旧 corepack(<0.31.0) 无法校验 npm 轮换后的新签名密钥（nodejs/corepack#612）。
- 修复（4 个 build stage 统一）：
  ```dockerfile
  RUN npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@8.11.0 --activate
  ```
- **pnpm 钉定 8.11.0**：匹配根 `package.json` 的 `packageManager`，且避免 pnpm v10 与
  `pnpm-lock.yaml`(v8 格式) 在 website stage 的 `--frozen-lockfile` 冲突。**勿改回 @latest**。

### 3.2 镜像缺少 `:latest` 标签（CI，已修，commit cf8d750）
- 症状：`docker-compose up` 报 `docker.io/casearxx/vanblog-v3:latest: not found`。
- 根因：`.github/workflows/docker-image.yml` 的 `docker/metadata-action` 默认对 push 到 main
  只生成 `main` 和 `<sha>` 标签，**不产出 latest**（latest 只在打 `v*` tag 时自动加）。
- 修复：tags 列表新增 `type=raw,value=latest,enable={{is_default_branch}}`。
- Docker Hub 现有标签：`main`（随 main 滚动）、`<sha>`、`latest`。
- 注意：CI 工作流仅 push `linux/amd64`（已移除 arm64 以加速），只推 Docker Hub（ghcr 已禁用）。

## 4. 安装脚本 vanblog.sh（已多次修改）

- 镜像统一 **`casearxx/vanblog-v3:latest`**（Docker Hub）。中国镜像分支**已整段删除**，
  pre_check 现**全部直连**：`Get_Docker_URL=get.docker.com`、`GITHUB_URL=github.com`、Docker Hub。
- `SCRIPT_URL`/`COMPOSE_URL` 指向 **raw.githubusercontent 直连**（菜单 20 自更新用 SCRIPT_URL）。
- `config()` **内置 compose 模板**（`write_compose_template()` 用 heredoc 写出），
  本地 `docker-compose/docker-compose-template.yml` 找不到时不再联网下载，脚本**完全自包含**。
  模板占位符 `vanblog_image`/`vanblog_email`/`vanblog_data_path`/`vanblog_http_port`/`vanblog_https_port`
  由 config() 的 sed 注入；改模板时务必保持这些占位符。
- `docker-compose/docker-compose.yml`（非模板，独立用）镜像也改为 `casearxx/vanblog-v3:latest`。

### 服务器侧部署要点
- 数据目录 `/var/vanblog`，编排文件 `/var/vanblog/docker-compose.yaml`。
- 在服务器更新脚本（公开后直连 raw）：
  ```bash
  curl -sL https://raw.githubusercontent.com/CasearF/vanblog-v3/main/vanblog.sh -o vanblog.sh && chmod +x vanblog.sh
  ```
- 若只想用现存标签立刻起服务，可临时把编排文件的 `:latest` 换 `:main`：
  ```bash
  sed -i 's#casearxx/vanblog-v3:latest#casearxx/vanblog-v3:main#g' /var/vanblog/docker-compose.yaml
  cd /var/vanblog && docker-compose up -d
  ```
- `version is obsolete` 仅为 compose v2 警告（可删 `version:` 字段），不影响运行。

## 5. 待办 / 后续可能的坑

- 国内服务器拉 Docker Hub 可能慢/超时 → 作者计划后续加镜像加速（届时改回对应 registry 地址）。
- 私有转公开后，脚本里的 raw / 菜单20自更新才生效；若以后再转私有需改回自包含/scp 方式。
- 低优先级未做：`JWT_TOKEN` 启动竞态退化为随机盐（waline.provider.ts）；WaLine 运行时硬依赖 unpkg.com。
