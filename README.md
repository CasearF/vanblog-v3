<p align="center">
	<img src="/img/logo.svg" style="width: 200px"></img>
</p>
<p align="center">
	<strong>VanBlog 是一款简洁、实用、优雅的个人博客系统，支持全自动按需申请 HTTPS 证书、黑暗模式、移动端自适应和评论功能。它内置了流量统计和图床，并集成了评论系统。此外还具有无限的可扩展性，提供完备的后台管理面板、强大的编辑器，支持一键上传剪贴板图片到图床。</strong>
</p>
<p align="center">
  <img src="https://github.com/CasearF/vanblog-v3/actions/workflows/docker-image.yml/badge.svg" />
  <img src="https://img.shields.io/docker/pulls/casearxx/vanblog-v3" />
  <img src="https://img.shields.io/docker/image-size/casearxx/vanblog-v3/latest" />
  <img src="https://img.shields.io/github/stars/CasearF/vanblog-v3" />
  <img src="https://img.shields.io/github/last-commit/CasearF/vanblog-v3" />
  <img src="https://img.shields.io/badge/license-GPL%20v3-yellow.svg" />
</p>
<p align="center">
	<strong>仓库：</strong> <a target="_blank" href="https://github.com/CasearF/vanblog-v3">github.com/CasearF/vanblog-v3</a>
	&nbsp;·&nbsp;
	<strong>维护者：</strong> <a target="_blank" href="https://casear.net">Casear（casear.net）</a>
</p>

> [!NOTE]
> **这是由 [Casear](https://casear.net)（[@CasearF](https://github.com/CasearF)）维护的 VanBlog 分支。**
> 原项目 [Mereithhh/vanblog](https://github.com/Mereithhh/vanblog) 已停更，本分支在其基础上保守维护、修 bug、加功能，
> 与上游保持同构。北极星沿用原作者那句 —— **「快到极致的响应速度，Lighthouse 接近满分」**。
> 自建镜像：[`casearxx/vanblog-v3`](https://hub.docker.com/r/casearxx/vanblog-v3)（CI 构建后冒烟测试通过才推送）。

## 本分支做了什么

- 🐞 **评论系统（WaLine）全链路修复**：注册/登录 404、导入失败、评论不显示、列表 500、改资料报错等 P0 逐一闭环。
- 🎨 **主题系统**：新增可切换的前端渲染器框架（`themes/`）与 `nova` / `nova-nebula` 主题，后台一键切换。
- 🔗 **前后端共享类型契约**：新增 [`@vanblog/shared`](packages/shared/README.md)，把 server 返回结构与前端类型统一为单一来源，接口漂移在编译期即报错。
- 🚦 **CI 构建后冒烟门禁**：镜像构建完先拉起容器断言关键端点（`scripts/ci-smoke-test.sh`），冒烟通过才推镜像。
- 📤 **文章快捷分享**：文章页底部一行分享按钮（复制链接 / 微博 / QQ空间 / X / Telegram，移动端额外走系统分享面板），三套主题全接、零新依赖。
- 👍 **文章反应（WaLine reaction）**：文章底部一排表情反应（赞同 / 喜欢 / 开心 / 惊讶 / 思考 / 反对），表情用内联 data-URI SVG 自托管（零第三方 CDN、零额外请求），复用 WaLine 既有 `/api/article` 计数，server 零改动。
- 🧹 **前端 ESLint 接线**：website 包补上 `.eslintrc.json`（`next/core-web-vitals`，激活 `react-hooks` / `jsx-a11y`），`pnpm lint` 作为独立门禁、与生产构建解耦；顺手修了 3 个真实报错（自定义脚本缺 `id`、`children` 当 prop 传），其余历史约定项与 hooks 告警已分级，详见维护笔记。
- ⚡ **性能优化（进行中）**：以最重文章页跑 Lighthouse 实测驱动，详见 [`docs/custom/`](docs/custom/) 下的维护笔记。

## 预览图

![前台-白色](/img/合并.png)

## 特性

- [x] 快到极致的响应速度，Lighthouse 接近满分。
- [x] 独一份的按需全自动 HTTPS，甚至不用填域名。
- [x] 包括完整的前后台和服务端。
- [x] 前台和后台都为响应式设计，完美适配移动端和多尺寸设备。
- [x] 前台和后台都支持黑暗模式，并可自动切换。
- [x] 前台为静态网页（SSG），并支持秒级的增量渲染，每次改动无需重新构建全部页面。
- [x] SEO 和无障碍友好，支持自定义文章路径。
- [x] 静态网页，CDN 友好。
- [x] 版本号展示和更新提醒。
- [x] 基于 React，项目工程化，二次开发友好。
- [x] 内置强大的分析功能，可统计访客等数据，并配有精美看板。
- [x] 内嵌评论系统。
- [x] 强大的 Markdown 编辑器，支持图表和数学公式，一键插入 more 标记，一键剪贴板及本地图片上传，支持自定义高亮块语法，支持 Emoji 表情选取。
- [x] TOC、草稿、代码复制、访客数、评论数、分类、标签、搜索、加密、友链、打赏、自定义导航栏。
- [x] 多个布局设置，可自定义页面细节。
- [x] 高度定制化，可添加自定义 CSS、HTML 和 JS 代码。
- [x] 支持自定义页面。
- [x] 可添加具有指定权限的协作者。
- [x] 内置图床，并支持各种 OSS 图床、github 图床（外部图床基于 picgo）等。
- [x] 支持上传图片自动添加水印，无论何种图床。
- [x] 支持上传图片自动压缩，无论何种图床。
- [x] 极致轻量化，没有花里胡哨。页面秒切换、图片懒加载。
- [x] 脚本一键部署，多种部署方式，支持 ARM 平台。
- [x] 支持 GA、百度分析。
- [x] 简单易用的后台，支持数据的导出与导入。
- [x] 支持 RSS 订阅。
- [x] 完善的 API，完全利用本项目后台和服务端，自己写前端或适配其他页面生成器。
- [x] 有较完善的日志记录，后台可直接查看登录日志和 Caddy 日志。

## 快速上手 / 部署

一键脚本部署（拉取本分支的 `vanblog.sh`，使用 `casearxx/vanblog-v3` 镜像）：

```bash
curl -sL https://raw.githubusercontent.com/CasearF/vanblog-v3/main/vanblog.sh -o vanblog.sh && chmod +x vanblog.sh && ./vanblog.sh
```

将来需要再次运行（如更新、改配置），直接：

```bash
./vanblog.sh
```

> 部署、CI、WaLine 排障等实战记录见 [`docs/custom/deployment-and-ci-notes.md`](docs/custom/deployment-and-ci-notes.md)。

## 文档与常见问题

本分支与上游同构，软件层面的使用文档可直接参考**上游文档**（仍然适用）：

- 使用指南：[vanblog.mereith.com/guide/get-started](https://vanblog.mereith.com/guide/get-started.html)
- 反向代理：[reverse-proxy](https://vanblog.mereith.com/reference/reverse-proxy.html)
- 备份与迁移：[backup](https://vanblog.mereith.com/guide/backup.html)
- 常见问题汇总：[FAQ](https://vanblog.mereith.com/faq/)

本分支特有的维护笔记（路线对比、性能实测、部署排障）集中在 [`docs/custom/`](docs/custom/)。

## TODO / Roadmap

- [ ] 性能优化 Option A：去掉 bytemd 客户端二次水合，改静态渲染 SSR 产出的 HTML（唯一确认能上分的方向）
- [ ] husky + nano-staged 提交前钩子（接 `pnpm lint`，commit 前挡新增 lint 问题）
- [ ] 核心 provider 单测（vitest），与 CI 冒烟形成上下两层防线
- [x] 前端 ESLint 接线：website 补 `.eslintrc.json`（`next/core-web-vitals`）+ `pnpm lint`，`react-hooks` / `jsx-a11y` 规则生效；与构建解耦，findings 已分级（详见维护笔记）
- [x] 快捷分享按钮：文章页内置复制链接 / 微博 / QQ空间 / X / Telegram + 移动端系统分享，三主题全接、零新依赖
- [x] 主题（前端渲染器）系统：`themes/` 框架 + nova / nova-nebula，后台一键切换
- [x] 前后端共享类型契约包 `@vanblog/shared`：server 返回结构与 website 类型单一来源，漂移编译期报错
- [x] e2e / CI：构建后容器冒烟测试，断言关键端点，通过才推送镜像
- [x] WaLine 评论系统 P0 全链路修复

> 更早的上游历史 TODO（已完成的大量基础能力）见上游仓库。

## 问题反馈

请在本仓库提 [issue](https://github.com/CasearF/vanblog-v3/issues)。

## CHANGELOG

[CHANGELOG](CHANGELOG.md)

## Lighthouse

<p align="center">
  <img src="/img/lighthouse.png" style="width: 400px"></img>
</p>

## 致谢原作者

VanBlog 由 **[Mereithhh](https://github.com/Mereithhh)** 创作并开源，是一件设计与工程都非常用心的作品。
本分支只是在原作者停更后接力做保守维护，所有核心设计与绝大部分代码的功劳都属于原作者。在此郑重致谢与纪念 🙏

- 原项目仓库：[Mereithhh/vanblog](https://github.com/Mereithhh/vanblog)
- 原项目主页 / 文档：[vanblog.mereith.com](https://vanblog.mereith.com)
- 原版在线 Demo：[blog-demo.mereith.com](https://blog-demo.mereith.com)
- 作者博客：[mereith.com](https://www.mereith.com)

如果你喜欢 VanBlog，请优先去给[原项目](https://github.com/Mereithhh/vanblog)点一个 Star ⭐。

## License

[GPL-3.0](LICENSE)，沿用上游协议。
