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

### 7.3 关键文件路径

| 用途          | 路径                                                         |
| ------------- | ------------------------------------------------------------ |
| 主题类型      | `packages/website/themes/types.ts`                           |
| 主题加载      | `packages/website/themes/index.ts`                           |
| Layout 集成   | `packages/website/components/Layout/index.tsx`               |
| Nova 样式     | `packages/website/themes/nova/styles/nova.css`               |
| Nova CSS 覆盖 | `packages/website/themes/nova/styles/nova.css` (末尾章节 26) |
| 后台主题 UI   | `packages/admin/src/pages/SystemConfig/tabs/Advance.jsx`     |
| API 客户端    | `packages/admin/src/services/van-blog/api.js`                |
| 文档目录      | `docs/custom/`                                               |
| AI 记忆       | `docs/custom/KILO-MEMORY.md`                                 |

### 7.4 Nova 主题 CSS 结构

```
nova.css 章节索引:
1.  CSS Variables (62行)
2.  Base Styles
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
18. Link Card (新增)
19. Key Card (新增)
20. Search Card (新增)
21. Alert Card (新增)
22. Social Card (新增)
23. Post Card (新增)
24. Post Card Title & Subtitle (新增)
25. Markdown Content (新增)
26. Override Default Components (新增 - CSS 覆盖策略)
```

---

**最后更新**: 2026-04-19 22:43 **维护者**: Kilo AI
