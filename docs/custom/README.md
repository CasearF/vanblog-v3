# 自定义修改文档

此目录包含对 VanBlog 项目进行的所有自定义修改的文档。

## 文档列表

| 文档 | 说明 |
| --- | --- |
| [dependency-updates.md](./dependency-updates.md) | 依赖更新记录，包含保守更新策略和版本变更清单 |
| [dockerfile-fix.md](./dockerfile-fix.md) | Dockerfile 构建参数修复，解决 `VAN_BLOG_BUILD_SERVER` 默认值问题 |
| [theme-system.md](./theme-system.md) | 主题系统框架，支持多主题切换 |

## 功能状态

| 功能            | 状态      | 说明                       |
| --------------- | --------- | -------------------------- |
| 依赖更新        | ✅ 完成   | 已更新到保守版本           |
| Dockerfile 修复 | ✅ 完成   | 添加默认值支持             |
| 主题系统        | ✅ 完成   | 支持 default/nova 主题切换 |
| Nova 主题开发   | ⚠️ 待完善 | 目前只是默认主题副本       |

## 更新日志

### 2026-04-19

- ✅ 完成 Layout 组件主题动态加载集成
- ✅ 添加主题设置 UI 到后台 Advance 页面
- ⚠️ Nova 主题待开发独立样式

### 2026-04-19 (初始化)

- 添加主题系统框架文档
- 添加 Dockerfile 修复文档
- 添加依赖更新文档

---

**维护者**: AI Assistant (Kilo)  
**项目**: VanBlog 个人博客系统  
**状态**: 持续更新中
