# Waline 反应功能问题

**日期**: 2026-04-20

## 问题描述

Waline v3 客户端启用了 `reaction: true` 文章反应功能，但遇到以下问题：

1. **Admin 面板 404 错误**: `POST /api/article?lang=zh-CN 404 (Not Found)`
   - 来源: `ArticleReaction.vue` 组件
   - 原因: VanBlog 后端没有 `/api/article` POST 端点

2. **后端不支持**: `@waline/vercel` 最新版本仍是 v1，不完全支持 Waline v3 的 reaction 功能

## 解决方案

暂时禁用 Waline reaction 功能，等待后端支持。

## 相关文件

- `packages/website/components/WaLine/core.tsx` - Waline 初始化配置
- `packages/website/themes/nova/styles/nova.css` - Nova 主题 Waline 样式
- `packages/website/themes/nova-nebula/styles/nova.css` - Nova Nebula 主题 Waline 样式

## 后续

- 等待 `@waline/vercel` 升级到支持 v3 reaction 的版本
- 或考虑使用其他后端部署方式（Cloudflare Pages, Deno Deploy 等）
