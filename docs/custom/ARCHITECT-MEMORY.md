# VanBlog 项目架构记忆存储

> 本文件记录 AI 对 VanBlog 项目的架构理解、项目结构和关键上下文，供后续会话参考。

---

## 项目信息

- **项目**: VanBlog 个人博客系统
- **当前时间**: 2026-04-21
- **维护者**: Architect AI
- **工作模式**: 熟悉代码仓库、架构分析

---

## 一、项目概述

VanBlog 是一款简洁、实用、优雅的个人博客系统，主要特性：

- 🚀 Lighthouse 接近满分
- 🔒 自动 HTTPS 证书申请 (Caddy)
- 🌙 黑暗模式支持
- 📱 响应式设计
- 🖼️ 内置图床 + OSS 支持
- 💬 Waline 评论系统
- 📊 访客统计分析
- 📝 Markdown 编辑器
- 🔍 SEO 友好

---

## 二、技术栈

| 组件 | 技术栈 | 说明 |
|------|--------|------|
| **Server** | NestJS + MongoDB/Mongoose + TypeScript | 后端 API 服务 |
| **Admin** | UmiJS + Ant Design Pro + React 17 | 后台管理面板 |
| **Website** | Next.js 13 + React 18 + Tailwind CSS | 前台主题（SSG） |
| **Waline** | Waline 评论系统 | 内嵌评论服务 |
| **网关** | Caddy | 自动 HTTPS 反向代理 |

---

## 三、Monorepo 结构 (pnpm workspace)

```
packages/
├── admin/          # @vanblog/admin - 后台管理面板 (UmiJS)
├── server/         # @vanblog/server - 后端服务 (NestJS)
├── waline/         # @vanblog/waline - 评论系统
├── website/        # @vanblog/theme-default - 前台主题 (Next.js)
└── cli/            # @vanblog/cli - 命令行工具
docs/               # 项目文档 (VuePress)
```

---

## 四、Server 服务端架构

### 4.1 目录结构

```
packages/server/src/
├── controller/
│   ├── admin/      # 管理后台 API
│   │   ├── article/
│   │   ├── category/
│   │   ├── tag/
│   │   ├── setting/
│   │   ├── img/
│   │   ├── backup/
│   │   ├── isr/
│   │   ├── pipeline/
│   │   ├── token/
│   │   ├── collaborator/
│   │   ├── customPage/
│   │   ├── caddy/
│   │   ├── menu/
│   │   ├── link/
│   │   ├── meta/
│   │   ├── site/
│   │   ├── social/
│   │   ├── about/
│   │   ├── analysis/
│   │   ├── draft/
│   │   └── init/
│   └── public/     # 公开 API
├── scheme/         # MongoDB 数据模型
│   ├── article.schema.ts
│   ├── category.schema.ts
│   ├── tag.schema.ts
│   ├── setting.schema.ts
│   ├── user.schema.ts
│   ├── token.schema.ts
│   └── ...
├── provider/       # 业务服务提供者
├── utils/          # 工具函数
├── config/         # 配置
├── types/          # 类型定义
└── main.ts         # 入口文件
```

### 4.2 核心依赖

- JWT 认证: `@nestjs/jwt`, `passport-jwt`
- MongoDB: `mongoose`, `@nestjs/mongoose`
- API 文档: `@nestjs/swagger`
- 图片处理: `jimp`, `picgo`, `sharp`
- 定时任务: `@nestjs/schedule`

---

## 五、前台 Website 架构

### 5.1 目录结构

```
packages/website/
├── api/              # API 调用
├── components/       # React 组件
│   ├── Layout/       # 布局组件
│   ├── PostCard/     # 文章卡片
│   ├── NavBar/       # 导航栏
│   └── ...
├── pages/            # Next.js 页面
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx
│   ├── about/
│   ├── article/[id]/
│   ├── category/[name]/
│   ├── tag/[name]/
│   ├── links/
│   └── ...
├── themes/           # 主题系统
│   ├── types.ts
│   ├── index.ts
│   ├── default/
│   ├── nova/
│   └── nova-nebula/
├── styles/           # 全局样式
├── utils/            # 工具函数
└── public/           # 静态资源
```

### 5.2 主题系统

**支持的主题**:

| 主题名 | 描述 | 状态 |
|--------|------|------|
| default | VanBlog 默认主题 | ✅ 可用 |
| nova | The Verge 风格 | ✅ 可用 |
| nova-nebula | Premium Cosmic 宇宙风格 | ✅ 可用 |

**主题配置存储**: MongoDB `setting` collection, `type: "theme"`

---

## 六、Admin 后台架构

### 6.1 目录结构

```
packages/admin/src/
├── pages/            # 页面组件
│   ├── Dashboard/
│   ├── Article/
│   ├── Draft/
│   ├── Category/
│   ├── Tag/
│   ├── Media/
│   ├── Settings/
│   ├── SystemConfig/
│   ├── About/
│   ├── Link/
│   ├── Collaborator/
│   └── ...
├── components/       # 公共组件
├── services/         # API 服务调用
├── style/            # 样式文件
└── app.jsx           # 入口文件
```

### 6.2 技术特点

- UmiJS 框架
- Ant Design Pro 组件库
- ByteMD 编辑器（掘金同款）
- 支持 Markdown 增强（图表、数学公式、Mermaid）

---

## 七、部署架构

### 7.1 Docker 多阶段构建

```dockerfile
# 1. ADMIN_BUILDER - 打包后台管理面板
# 2. SERVER_BUILDER - 打包后端服务
# 3. WEBSITE_BUILDER - 打包前台静态网站
# 4. RUNNER - 最终运行容器（包含 Caddy 网关）
```

### 7.2 进程关系

```
Caddy (80/443)
├── /api/* → Server (3000)
├── /admin/* → Admin (静态)
├── /* → Website (3001)
└── /about/* → Waline
```

### 7.3 数据持久化

| 路径 | 说明 |
|------|------|
| `/app/static` | 图床文件 |
| `/var/log` | 日志 |
| `/root/.config/caddy` | Caddy 配置 |
| `/root/.local/share/caddy` | SSL 证书 |

---

## 八、开发命令

```bash
# 开发全部（前台 3001、后台 3002、Server 3000）
pnpm dev

# 单独开发
pnpm dev:server   # Server 3000 端口
pnpm dev:website  # 前台 3001 端口
pnpm dev:admin    # 后台 3002 端口

# 构建
pnpm build        # 构建全部
pnpm build:admin
pnpm build:server
pnpm build:website

# 文档
pnpm docs:dev     # 开发文档
```

---

## 九、数据库依赖

- **MongoDB** - 主数据库
  - 版本: 4.4+
  - Collections: article, category, tag, setting, user, token, viewer, visit 等

---

## 十、关键配置文件

| 文件 | 说明 |
|------|------|
| `pnpm-workspace.yaml` | pnpm workspace 配置 |
| `package.json` | 根目录 package.json |
| `Dockerfile` | 主 Dockerfile |
| `docker-compose/docker-compose.yml` | Docker Compose 配置 |
| `caddyTemplate.json` | Caddy 配置模板 |

---

## 十一、维护者信息

| 维护者 | 说明 |
|--------|------|
| **Mereith** | 项目原作者 |
| **Kilo AI** | 主题系统、Nova 主题开发 |
| **Architect AI** | 架构分析、文档整理 |

---

## 十二、快速参考

### 12.1 添加新主题步骤

1. 创建 `packages/website/themes/newtheme/theme.ts`
2. 在 `themes/index.ts` 注册
3. 在 `packages/admin/src/pages/SystemConfig/tabs/Advance.jsx` 添加选项
4. 创建对应的 CSS 样式
5. 在 `_app.tsx` 导入主题 CSS

### 12.2 关键文件路径

| 用途 | 路径 |
|------|------|
| 主题类型 | `packages/website/themes/types.ts` |
| 主题加载 | `packages/website/themes/index.ts` |
| Layout 集成 | `packages/website/components/Layout/index.tsx` |
| 后台主题 UI | `packages/admin/src/pages/SystemConfig/tabs/Advance.jsx` |
| Server 入口 | `packages/server/src/main.ts` |
| AI 记忆 | `docs/custom/KILO-MEMORY.md` |

---

**最后更新**: 2026-04-21 **维护者**: Architect AI
