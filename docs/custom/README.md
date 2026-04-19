# 自定义修改文档

> 此目录包含对 VanBlog 项目进行的所有自定义修改的文档记录。

---

## 文档列表

| 文档 | 说明 |
| --- | --- |
| [dependency-updates.md](./dependency-updates.md) | 依赖更新记录，包含保守更新策略和版本变更清单 |
| [dockerfile-fix.md](./dockerfile-fix.md) | Dockerfile 构建参数修复，解决 `VAN_BLOG_BUILD_SERVER` 默认值问题 |
| [theme-system.md](./theme-system.md) | 主题系统框架，支持多主题切换（详细技术文档） |
| [nova-theme.md](./nova-theme.md) | Nova 主题设计规范和实现细节 |
| [nova-nebula-theme.md](./nova-nebula-theme.md) | Nova Nebula 主题 - Premium Cosmic 宇宙风格 |

---

## 功能状态总览

| 功能             | 状态    | 完成日期   | 备注                    |
| ---------------- | ------- | ---------- | ----------------------- |
| 依赖保守更新     | ✅ 完成 | 2026-04-19 | 更新了 8 个包的依赖     |
| Dockerfile 修复  | ✅ 完成 | 2026-04-19 | 添加默认值支持          |
| 主题系统框架     | ✅ 完成 | 2026-04-19 | 支持多主题切换          |
| Nova 主题        | ✅ 完成 | 2026-04-19 | 基于 The Verge 设计风格 |
| Nova Nebula 主题 | ✅ 完成 | 2026-04-20 | Premium Cosmic 宇宙风格 |
| 404 页面主题支持 | ✅ 完成 | 2026-04-20 | 404 页面应用主题样式    |

---

## 快速开始

### 1. 查看当前状态

```bash
git status
```

### 2. 更新依赖

```bash
# 根目录
pnpm update

# 或更新特定包
cd packages/server && pnpm update
```

### 3. 构建项目

```bash
# 全部构建
pnpm build

# 分别构建
cd packages/server && pnpm build
cd packages/admin && pnpm build
cd packages/website && pnpm build
```

### 4. Docker 构建

```bash
# 方式一：使用默认值
docker build -t vanblog:test .

# 方式二：指定构建服务器
docker build \
  --build-arg VAN_BLOG_BUILD_SERVER=http://localhost:3000 \
  -t vanblog:test .
```

---

## 架构改动概览

```
vanblog/
├── packages/
│   ├── server/          # 后端 API 服务
│   │   ├── src/types/setting.dto.ts           [修改]
│   │   ├── src/provider/setting/             [修改]
│   │   └── src/controller/                   [修改]
│   │
│   ├── website/         # 前台博客
│   │   ├── themes/                        [新增]
│   │   │   ├── types.ts                  [新增]
│   │   │   ├── index.ts                   [新增]
│   │   │   ├── ThemeContext.tsx           [新增]
│   │   │   ├── default/theme.ts           [新增]
│   │   │   ├── nova/                      [新增]
│   │   │   │   └── ... (14 组件 + CSS)
│   │   │   └── nova-nebula/               [新增]
│   │   │       └── ... (14 组件 + CSS)    (1896+ 行)
│   │   │
│   │   ├── components/Layout/index.tsx     [修改]
│   │   ├── pages/_app.tsx                  [修改]
│   │   ├── pages/404.tsx                   [修改]
│   │   ├── api/getAllData.ts               [修改]
│   │   └── utils/getLayoutProps.ts         [修改]
│   │
│   └── admin/           # 后台管理系统
│       ├── src/services/van-blog/api.js    [修改]
│       └── src/pages/SystemConfig/tabs/Advance.jsx  [修改]
│
├── docs/custom/          # 本文档目录
│   ├── README.md
│   ├── dependency-updates.md
│   ├── dockerfile-fix.md
│   ├── theme-system.md
│   ├── nova-theme.md
│   └── nova-nebula-theme.md
│
└── The-Verge-DESIGN.md   # The Verge 设计规范源文件
```

---

## 数据库变更

### Setting Collection 新增文档

```javascript
// type: 'theme'
{
  "_id": ObjectId("..."),
  "type": "theme",
  "value": {
    "theme": "nova"  // 或 "default"
  },
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## API 变更

### 新增端点

| 方法 | 路径                       | 说明             |
| ---- | -------------------------- | ---------------- |
| GET  | `/api/admin/setting/theme` | 获取当前主题配置 |
| PUT  | `/api/admin/setting/theme` | 更新主题配置     |

### 修改端点

| 路径                   | 修改内容              |
| ---------------------- | --------------------- |
| `GET /api/public/meta` | 新增返回 `theme` 字段 |

---

## 主题切换流程

```
1. 用户在后台 (http://localhost:3002/admin)
   └─ System Config → Advance 标签
      └─ 主题设置卡片 → 选择主题 → 保存

2. 请求: PUT /api/admin/setting/theme
   Body: { "theme": "nova" }

3. MongoDB 更新 Setting collection
   {
     type: "theme",
     value: { theme: "nova" }
   }

4. 管理员在后台触发 ISR 重建
   (或等待自动重建)

5. 前台页面重新构建
   └─ getStaticProps 获取 meta 数据
      └─ 包含 theme: "nova"

6. Layout 组件根据 theme 字段
   └─ 加载 novaTheme.components
      └─ 渲染 NovaNavBar, NovaLayoutBody, NovaFooter 等
```

---

## 开发指南

### 添加新主题

1. 在 `packages/website/themes/` 下创建新目录，如 `mytheme/`
2. 创建 `theme.ts` 入口文件，导出 Theme 对象
3. 在 `packages/website/themes/index.ts` 中注册主题
4. 在 `packages/admin/src/pages/SystemConfig/tabs/Advance.jsx` 添加选项
5. 在 `packages/website/pages/_app.tsx` 导入主题 CSS

### 修改 Nova/Nova Nebula 主题

主要文件：

| 文件                                 | 用途                            |
| ------------------------------------ | ------------------------------- |
| `themes/nova/styles/nova.css`        | Nova 主题全部样式               |
| `themes/nova-nebula/styles/nova.css` | Nova Nebula 主题样式 (1896+ 行) |
| `themes/nova/theme.ts`               | Nova 主题组件映射               |
| `themes/nova-nebula/theme.ts`        | Nova Nebula 主题组件映射        |
| `themes/nova/NovaNavBar.tsx`         | Nova 导航栏组件                 |
| `themes/nova-nebula/NovaNavBar.tsx`  | Nebula 导航栏组件 (共用)        |
| `themes/nova/NovaLayoutBody.tsx`     | 主体布局组件                    |
| `themes/nova/NovaFooter.tsx`         | 页脚组件                        |
| `themes/nova/NovaArticleCard.tsx`    | 文章卡片组件                    |
| `themes/nova/NovaTimeline.tsx`       | 时间线组件                      |
| `themes/nova/NovaAuthorCard.tsx`     | 作者卡片组件                    |

---

## 测试验证清单

- [x] Server 构建成功
- [x] Admin 构建成功
- [x] Website 构建成功
- [x] 后台主题设置 UI 显示正常
- [x] 主题切换后前台显示正确
- [x] Nova 主题样式符合 The Verge 设计规范
- [x] 灰色背景问题已修复
- [x] markdown-body 背景问题已修复

---

## 维护者

- **AI Assistant (Kilo)**
- **项目**: VanBlog 个人博客系统
- **状态**: 持续更新中

---

**最后更新**: 2026-04-20 00:32
