# Kilo AI 记忆存储

> 本文件记录 AI 在本项目中的所有工作进度、设计决策和关键上下文，供后续会话参考。

---

## 项目信息

- **项目**: VanBlog 个人博客系统定制开发
- **用户需求**: 保守更新依赖 + 添加自定义主题系统 + Nova (The Verge 风格) 主题
- **工作模式**: 开发阶段由 AI 负责，测试由用户完成
- **当前时间**: 2026-04-19 22:43

---

## 一、已完成的功能

### 1.1 依赖保守更新

**策略**: 只更新 minor/patch 版本，不升级 major 版本

**已更新包**:

- 根目录: eslint, prettier 等开发工具
- packages/server: axios, dayjs, highlight.js, mongoose 等
- packages/admin: antd, bytemd, emoji-mart 等
- packages/website: bytemd, dayjs, react-photo-view, sharp 等

**跳过**: Waline (2.15.8), Monaco Editor (0.34.1) - 避免兼容问题

**验证**: 全部构建成功 ✅

### 1.2 Dockerfile 修复

**问题**: `VAN_BLOG_BUILD_SERVER` 无默认值，导致 `new URL("")` 报错

**解决**: 添加默认值 `http://localhost:3000`

```dockerfile
ARG VAN_BLOG_BUILD_SERVER=http://localhost:3000
```

### 1.3 主题系统框架

**架构**: 主题目录 + 动态加载

```
packages/website/themes/
├── types.ts          # Theme, ThemeConfig, ThemeComponents 接口
├── index.ts          # loadTheme(), getAvailableThemes()
├── ThemeContext.tsx  # 预留
├── default/theme.ts  # 复用现有组件
└── nova/theme.ts     # Nova 主题入口
```

**主题接口**:

```typescript
interface Theme {
  config: ThemeConfig; // name, description, version, author
  components: ThemeComponents; // 组件名 -> React 组件映射
}
```

### 1.4 Layout 集成

**文件**: `packages/website/components/Layout/index.tsx`

**方案**: 主题组件映射表 + 动态调用

```typescript
const themesComponents = {
  default: defaultTheme.components,
  nova: novaTheme.components,
};

const NavBarComponent = themesComponents[themeName].NavBar || defaultTheme.components.NavBar;
```

### 1.5 后台主题设置 UI

**文件**: `packages/admin/src/pages/SystemConfig/tabs/Advance.jsx`

**功能**: ProFormSelect 下拉选择 default/nova 主题

### 1.6 Nova 主题 (The Verge 风格)

**完整组件清单** (14 个):

| 组件 | 文件 | 说明 |
| --- | --- | --- |
| NovaNavBar | `NovaNavBar.tsx` (73行) | 大字报 Wordmark + ALL-CAPS 导航 |
| NovaLayoutBody | `NovaLayoutBody.tsx` (21行) | 主内容 + 侧边栏布局 |
| NovaFooter | `NovaFooter.tsx` (59行) | Mono 版权信息 |
| NovaArticleCard | `NovaArticleCard.tsx` (97行) | 随机彩色填充卡片 + ArticleList + ArticleItem |
| NovaPostCard | `NovaPostCard.tsx` (128行) | 文章详情页卡片 |
| NovaTimeline / NovaTimelineItem | `NovaTimeline.tsx` (52行) | StoryStream 垂直时间线 |
| NovaAuthorCard | `NovaAuthorCard.tsx` (19行) | 80px 圆形头像卡片 |
| NovaLinkCard | `NovaLinkCard.tsx` (27行) | 友链卡片 |
| NovaSearchCard | `NovaSearchCard.tsx` (130行) | 搜索弹窗 (Ctrl+K) |
| NovaKeyCard | `NovaKeyCard.tsx` (35行) | 快捷键提示 |
| NovaAlertCard | `NovaAlertCard.tsx` (26行) | 文章过期警告 |
| NovaSocialCard | `NovaSocialCard.tsx` (52行) | 社交图标 |
| styles/nova.css | `nova.css` (1318+ 行) | 完整样式 |

**设计规范**:

- Canvas Black (#131313) 背景
- Jelly Mint (#3cffd0) 主强调
- Verge Ultraviolet (#5200ff) 次强调
- 20px 药丸卡片圆角
- 饱和色块填充 (yellow, pink, orange, blue, purple)
- 悬停链接变 Deep Link Blue (#3860be)
- 无阴影，1px 边框做深度

**CSS 覆盖策略**:

由于页面组件（PostCard 等）直接导入而非通过主题系统，Nova 采用 CSS 选择器覆盖策略：

```css
.nova-theme .post-card { ... }      /* 覆盖默认 PostCard 样式 */
.nova-theme .markdown-body { ... }  /* 覆盖 Markdown 内容样式 */
.nova-theme .bg-white { ... }       /* 覆盖白色背景 */
```

**核心 CSS 变量**:

```css
--nova-canvas: #131313 /* 主背景 */ --nova-surface-slate: #2d2d2d /* 卡片背景 */
  --nova-jelly-mint: #3cffd0 /* 主强调色 */ --nova-ultraviolet: #5200ff /* 次强调色 */
  --nova-primary-text: #ffffff /* 主文本 */ --nova-secondary-text: #949494 /* 次文本 */;
```

---

## 二、数据库 & API 变更

### 2.1 数据库

**Collection**: `setting` **Document**:

```javascript
{
  type: "theme",
  value: { theme: "nova" }  // 或 "default"
}
```

### 2.2 API 端点

| 方法 | 路径                       | 说明                  |
| ---- | -------------------------- | --------------------- |
| GET  | `/api/admin/setting/theme` | 获取主题配置          |
| PUT  | `/api/admin/setting/theme` | 更新主题配置          |
| GET  | `/api/public/meta`         | 返回新增 `theme` 字段 |

---

## 三、文件变更清单

### 3.1 新增文件

```
docs/custom/
├── nova-theme.md                              # Nova 主题设计文档

packages/website/themes/
├── types.ts                                    # 主题类型定义
├── index.ts                                    # 主题加载器
├── ThemeContext.tsx                            # 主题上下文
├── default/theme.ts                            # 默认主题入口
└── nova/
    ├── theme.ts                               # Nova 主题入口
    ├── NovaNavBar.tsx                         # 导航栏
    ├── NovaLayoutBody.tsx                     # 布局组件
    ├── NovaFooter.tsx                         # 页脚
    ├── NovaAuthorCard.tsx                      # 作者卡片
    ├── NovaArticleCard.tsx                     # 文章卡片 (含 ArticleList/ArticleItem)
    ├── NovaPostCard.tsx                        # 文章详情卡片
    ├── NovaTimeline.tsx                        # 时间线
    ├── NovaLinkCard.tsx                        # 友链卡片
    ├── NovaSearchCard.tsx                       # 搜索弹窗
    ├── NovaKeyCard.tsx                         # 快捷键
    ├── NovaAlertCard.tsx                       # 过期提醒
    ├── NovaSocialCard.tsx                      # 社交卡片
    └── styles/nova.css                        # Nova 样式 (1563+ 行)
```

### 3.2 修改文件

```
Dockerfile                                              # 添加默认值
docs/custom/
├── README.md                                           # 项目概览文档
├── theme-system.md                                     # 主题系统详细文档
├── nova-theme.md                                       # Nova 主题文档
├── dependency-updates.md                                # 依赖更新记录
├── dockerfile-fix.md                                   # Dockerfile 修复说明
└── KILO-MEMORY.md                                     # AI 记忆存储

packages/server/
├── src/types/setting.dto.ts                           # 添加 theme type
├── src/provider/setting/setting.provider.ts            # 添加 theme 方法
├── src/controller/admin/setting/setting.controller.ts  # 添加 API
└── src/controller/public/public.controller.ts          # 添加 theme 字段

packages/website/
├── api/getAllData.ts                                   # 添加 theme 字段
├── utils/getLayoutProps.ts                            # 添加 theme 字段
├── components/Layout/index.tsx                         # 主题动态加载
└── pages/_app.tsx                                     # 导入 nova.css

packages/admin/
├── src/services/van-blog/api.js                       # 添加 theme API
└── src/pages/SystemConfig/tabs/Advance.jsx           # 主题设置 UI
```

---

## 四、设计决策记录

### 4.1 为什么用组件映射而不是 Theme Provider？

1. VanBlog 使用 Next.js getStaticProps，数据在构建时确定
2. 组件映射更简单，无需额外 Context
3. 对现有代码侵入性最小

### 4.2 为什么复用 Layout 容器？

- Layout 包含 HTML head、body 结构
- CSS 变量在 nova.css 中定义
- 只需替换内部子组件 (NavBar, LayoutBody, Footer)

### 4.3 为什么 Nova 主题的 Layout 也复用原有组件？

- 保持与默认主题相同的 HTML 结构
- Nova 样式通过 CSS 类名实现
- 避免破坏 SEO 和现有功能

### 4.4 为什么 PostCard 需要 CSS 覆盖而不是主题组件？

PostCard 等组件在页面文件中直接导入：

```typescript
import PostCard from '../../components/PostCard';
```

不通过 Layout/主题系统。解决方案是 CSS 选择器覆盖：

```css
.nova-theme .post-card {
  background-color: var(--nova-surface-slate) !important;
}
```

### 4.5 markdown-body 背景问题

**问题**: `.markdown-body` 使用 `--color-canvas-default` 变量作为背景色

**解决**: 在 nova.css 中覆盖：

```css
.nova-theme .markdown-body {
  background-color: transparent !important;
}
```

---

## 五、已知问题和解决方案

### 5.1 Windows pnpm symlink 问题

**问题**: `EPERM: operation not permitted, symlink`

**原因**: pnpm 在 Windows 上需要管理员权限创建 symlink

**解决方案**:

1. 启用 Windows 开发者模式
2. 或在 Linux/macOS 上构建
3. 不影响代码正确性，编译和静态生成都成功

### 5.2 主题预览需要 ISR 重建

**问题**: 切换主题后前台不会立即生效

**原因**: Next.js ISR 静态页面缓存

**解决方案**: 后台手动触发"重建静态页面"

### 5.3 NovaNavBar 修复记录

**修复内容**:

1. **导航栏间距**: 导航栏 padding 从 16px 增加到 24px，内容区 padding-top 增加到 32px
2. **搜索图标**: 添加了搜索图标和 Ctrl+K 提示
3. **搜索弹窗抖动**: 改用 `opacity` + `display: none` 代替 `scale`，添加 `z-index: 9999`
4. **HOME 链接**: 移除硬编码的 HOME，改为后台控制的菜单
5. **明暗切换**: Nova 主题不需要（始终深色）

**CSS 关键调整**:

```css
.nova-nav {
  position: sticky;
  top: 0;
  z-index: 90;
  padding: 24px 0;
}

.nova-nav-wordmark {
  margin-right: 32px;
}

.nova-search-overlay {
  z-index: 9999;
}
```

### 5.4 手机端样式修复

**修复内容**:

1. **MANAGE 按钮**: 改为药丸形状，添加响应式尺寸，380px 以下隐藏
2. **手机菜单颜色**: `.bm-menu` 和 `.bm-menu-wrap` 背景从 `#26282c` 改为 `#131313`
3. **菜单分界线**: 移除 `.bm-menu` 和 `.bm-menu-wrap` 的 box-shadow 和 border

**CSS 关键调整**:

```css
/* MANAGE 按钮药丸形状 */
.nova-nav-actions .nova-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  font-size: 11px;
  border-radius: 24px;
  background-color: var(--nova-jelly-mint);
  color: var(--nova-absolute-black);
}

@media (max-width: 380px) {
  .nova-nav-actions .nova-btn-primary {
    display: none;
  }
}

/* 手机菜单 */
.nova-theme .bm-menu-wrap,
.nova-theme .bm-menu {
  background-color: var(--nova-canvas) !important;
  box-shadow: none !important;
  border: none !important;
}
```

---

## 六、测试验证结果

- [x] Server 构建成功
- [x] Admin 构建成功
- [x] Website 构建成功（symlink 警告可忽略）
- [x] 后台主题设置 UI 显示正常
- [x] Nova 主题样式正确显示
- [x] 灰色背景问题已修复
- [x] markdown-body 背景问题已修复
- [x] 导航栏间距调整完成
- [x] 搜索弹窗功能正常，无抖动
- [x] 导航栏菜单由后台控制
- [x] 手机端 MANAGE 按钮药丸形状
- [x] 手机菜单背景颜色正确
- [x] 手机菜单无分界线

---

## 七、快速参考

### 7.1 主题切换流程

```
后台保存 → MongoDB (type="theme") → ISR 重建 → Layout 根据 theme 渲染组件
```

### 7.2 添加新主题步骤

1. 创建 `themes/newtheme/theme.ts`
2. 在 `themes/index.ts` 注册
3. 在 `packages/admin/.../Advance.jsx` 添加选项
4. 创建对应的 CSS 样式
5. 在 `_app.tsx` 导入主题 CSS

### 7.3 关键文件路径

| 用途             | 路径                                                     |
| ---------------- | -------------------------------------------------------- |
| 主题类型         | `packages/website/themes/types.ts`                       |
| 主题加载         | `packages/website/themes/index.ts`                       |
| Layout 集成      | `packages/website/components/Layout/index.tsx`           |
| CSS 导入         | `packages/website/pages/_app.tsx`                        |
| Nova 样式        | `packages/website/themes/nova/styles/nova.css`           |
| Nova Nebula 样式 | `packages/website/themes/nova-nebula/styles/nova.css`    |
| 后台主题 UI      | `packages/admin/src/pages/SystemConfig/tabs/Advance.jsx` |
| API 客户端       | `packages/admin/src/services/van-blog/api.js`            |
| 404 页面         | `packages/website/pages/404.tsx`                         |
| 文档目录         | `docs/custom/`                                           |
| AI 记忆          | `docs/custom/KILO-MEMORY.md`                             |

### 7.4 当前主题列表

| 主题名      | 描述                    | 状态    |
| ----------- | ----------------------- | ------- |
| default     | VanBlog 默认主题        | ✅ 可用 |
| nova        | The Verge 风格          | ✅ 可用 |
| nova-nebula | Premium Cosmic 宇宙风格 | ✅ 可用 |

---

## 八、Nova Nebula 主题背景更新

**更新日期**: 2026-04-19 23:55

**更新内容**: 为 Nova Nebula 主题添加 premium cosmic 背景效果

**设计灵感**:

- Apple keynote visuals
- OpenAI premium branding
- Luxury futuristic website design
- Premium AI landing page background

**视觉效果**:

- Deep black gradient (#050508 → #0a0a12)
- Subtle blue plasma nebula (rgba(14, 165, 233, 0.08))
- Violet nebula mist (rgba(139, 92, 246, 0.06))
- Floating intelligent particles (cyan glow dots)
- Soft volumetric glow orbs
- Elegant gradient lighting
- Cinematic depth with blur effects

**CSS 变更**:

- 更新 CSS 变量：`--nova-canvas: #050508`, `--nebula-blue`, `--nebula-violet`, `--nebula-cyan`
- 添加 nebula 背景层（::before, ::after 伪元素）
- 添加 floating particles 动画
- 添加 pulsing glow 动画
- 卡片添加 backdrop-filter blur 和半透明背景
- 边框改为 rgba(255, 255, 255, 0.06) 微妙边框
- **重要**: CSS 变量作用域改为 `.nova-nebula-theme` 而非 `:root`，避免污染 Nova 主题

**主题隔离修复** (2026-04-20 00:21-00:31):

问题：Nova 主题也变成星云样式原因：

1. nova-nebula.css 后加载，`:root` CSS 变量覆盖了 Nova 的
2. Layout 组件额外添加了 `nova-theme` class
3. nova-nebula.css 中大量裸选择器（如 `.nova-container`）直接污染全局

解决：

1. 将 `:root` 变量作用域改为 `.nova-nebula-theme`
2. 移除 Layout 中的额外 `nova-theme` class
3. 用脚本将所有裸选择器加上 `.nova-nebula-theme` 前缀
   - 基础类：`.nova-container`, `.nova-card`, `.nova-nav` 等
   - 子类：`.nova-headline-manuka`, `.nova-card-feature` 等
   - 伪类：`:hover`, `::before`, `::after` 等

**CSS 前缀脚本处理**:

- 27 个基础选择器
- 80+ 个派生选择器（包括 hover、pseudo-elements）
- 文件从 ~1657 行扩展到 ~1975 行

**Footer 发光线条修复** (2026-04-20 00:18):

问题：footer 背景是块状的，与宇宙背景融合不好解决：

- footer 背景改为透明
- 添加 1px 发光蓝线 (`rgba(14, 165, 233, 0.6)`)
- 多层 box-shadow 产生光晕扩散效果
- 线上方有柔和的径向发光 (`::after`)

**Nova CSS 结构** (1896+ 行):

```
1.  CSS Variables (Nebula Cosmic Palette)
2.  Base Styles with Nebula Background
3.  Typography
4.  Buttons
5.  Cards & Story Tiles
6.  StoryStream Timeline
7.  Navigation
8.  Article List
9.  Footer
10. Layout
11. Tags & Categories
12. Utilities
13. Animations
14. Author Card
15. Special Components
16. Dark Mode
17. Responsive
18-26. 各类组件样式
27. 404 Page Overrides
```

---

## 九、404 页面主题支持

**更新日期**: 2026-04-20 00:11

**文件**: `packages/website/pages/404.tsx`

**问题**: 404 页面独立于 Layout 组件，不使用 nova-theme class

**解决方案**:

1. 添加 `getStaticProps` 获取 theme 信息
2. 动态添加 `${themeName}-theme` class
3. 使用 inline styles 强制应用宇宙背景和文字颜色

```tsx
export async function getStaticProps() {
  const meta = await getPublicMeta();
  return {
    props: {
      theme: meta?.theme || 'default',
    },
  };
}

const isNebula = themeName === 'nova-nebula';
const nebulaBg = isNebula
  ? {
      background: `radial-gradient(...) ... linear-gradient(...)`,
    }
  : {};
```

---

## 十、Waline 评论系统问题

**问题**: 评论显示 "192.168.5.11 未发送任何数据"

**原因**: Waline 依赖未安装

**分析**:

- Waline 作为子进程启动 (`spawn 'node', ['../waline/node_modules/@waline/vercel/vanilla.js']`)
- `packages/waline` 的 `@waline/vercel` 依赖未安装
- 启动时应该看到 "Cannot find module" 错误

**解决**:

```bash
cd packages/waline
pnpm install
# 或
pnpm install  # 从根目录安装所有
```

**Waline 启动流程**:

1. `main.ts` 第 83-84 行调用 `walineProvider.init()`
2. `waline.provider.ts` 的 `run()` 方法 spawn 子进程
3. 子进程加载 `../waline/node_modules/@waline/vercel/vanilla.js`

**相关文件**:

- `packages/server/src/provider/waline/waline.provider.ts` - Waline 提供者
- `packages/waline/package.json` - Waline 依赖声明
- `packages/server/src/main.ts` - 启动入口

---

## 十一、后续功能想法

### 11.1 GitHub 主题仓库 + 安装脚本方案

**想法来源**: 2026-04-19 用户提出

**背景**: 用户提到作者原来在服务器上有个一键安装脚本，用户希望能在这个脚本中选择安装主题，然后默认要重启 Docker。

**方案设计**:

```
┌──────────────────┐
│  github.com      │
│  └── vanblog-themes/
│      ├── nova/
│      ├── nova-nebula/
│      └── other-theme/
└──────────────────┘
        │ git clone / 下载 release
        ▼
┌──────────────────┐
│  VanBlog Docker  │
│  └── /app/themes/
└──────────────────┘
```

**优点**:

- 安全性高（构建时打包，非运行时执行）
- 版本管理独立
- 更新方便（git pull）
- 维护成本低

**实现步骤**:

1. 创建独立主题仓库 `vanblog-themes`
2. 修改一键安装脚本，添加主题选择
3. 集成到 Docker 构建（ARG 或 volume 挂载）

**状态**: 想法记录，待实现

---

---

## 十二、Waline v3 升级

**更新日期**: 2026-04-20 13:26

**背景**: Waline v2 客户端 (`@waline/client@2.15.8`) + v1 服务端 (`@waline/vercel@1.31.7`) 使用旧 API `/comment`，Waline 提示即将废弃。

**升级方案**:

- 升级客户端到 `@waline/client@3.13.0`
- 服务端暂时保持 `@waline/vercel@1.39.3` (最新 v1 版本)
- 升级 `@waline/vercel` 后端到 v1.39.3

**问题**:

1. Waline v3 的 ESM 模块与直接 `<script>` 标签加载不兼容
2. 需要使用 `type="module"` 或 CDN 方式加载
3. CSS 导入路径变更: `@waline/client/dist/waline.css` → `@waline/client/waline.css`

**最终解决方案**: 使用 CDN 动态加载

```tsx
// packages/website/components/WaLine/core.tsx
import { useEffect } from 'react';

export default function WalineComponent(props) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/@waline/client@3.0.0/dist/waline.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `import { init } from 'https://unpkg.com/@waline/client@3.0.0/dist/waline.js'; window.__walineInit__ = init;`;
    document.head.appendChild(script);

    const fallback = document.createElement('script');
    fallback.textContent = `window.__walineInit__ = window.Waline;`;
    document.head.appendChild(fallback);

    setTimeout(() => {
      if (window.__walineInit__ && document.getElementById('waline')) {
        window.__walineInit__({
          el: '#waline',
          serverURL: window.location.protocol + '//' + window.location.host,
          dark: '.dark',
        });
      }
    }, 500);
  }, [props.enable]);
  // ...
}
```

**主题样式适配**:

由于 Waline 使用内联 CSS，无法通过外部 CSS 完全覆盖。已在主题 CSS 中添加样式：

```css
/* Nova 主题 */
.nova-theme #waline {
  --waline-bg-color: transparent !important;
  --waline-color: var(--nova-primary-text) !important;
  /* 绿色强调色 #3cffd0 */
}

/* Nova Nebula 主题 */
.nova-nebula-theme #waline {
  /* 绿色强调色 #3cffd0 */
}
```

**服务端问题修复**:

1. **WalineProvider stop 方法**: 添加 try-catch 和延迟
2. **WebsiteProvider stop 方法**: 同样添加错误处理
3. **端口占用**: 添加 500ms 延迟确保端口释放

**已修改文件**:

- `packages/website/components/WaLine/core.tsx` - Waline 组件
- `packages/website/themes/nova/styles/nova.css` - Nova Waline 样式
- `packages/website/themes/nova-nebula/styles/nova.css` - Nova Nebula Waline 样式

---

**最后更新**: 2026-04-20 14:05 **维护者**: Kilo AI

---

## 十三、文章反应功能（已禁用）

**更新日期**: 2026-04-20 13:46

**功能**: Waline v3 支持文章反应（reaction）功能

**启用方式**: 在 `core.tsx` 的 `init` 配置中添加 `reaction: true`

**禁用原因** (2026-04-20 14:05): 后端 `@waline/vercel` 仍是 v1 版本，不完全支持 v3 的 reaction 功能

**相关问题**: Admin 面板 ArticleReaction.vue 调用不存在的 `/api/article` POST 端点导致 404

**已回滚修改**:

- core.tsx: 移除 `reaction: true`
- nova.css: 移除 `.wl-reaction` 相关样式
- nova-nebula.css: 移除 `.wl-reaction` 相关样式

**状态**: 已禁用，等待 Waline 后端支持
