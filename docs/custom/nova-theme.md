# Nova 主题文档

> Nova 主题是基于 The Verge 2024 设计风格为 VanBlog 开发的新主题。本文档详细记录了主题的设计规范、组件实现和使用方法。

---

## 1. 设计理念

### 1.1 The Verge 风格概述

The Verge 2024 重新设计给人 "Condé Nast 杂志 + 芯片调音台 + 俱乐部夜店" 的感觉：

- **画布**: 近黑色 (`#131313`)
- **标题**: Manuka 字体高达 107px
- **强调色**: 酸薄荷绿 `#3cffd0` + 紫外光紫 `#5200ff`
- **卡片**: 饱和色块 (黄色、粉色、橙色、蓝色、紫色)
- **时间线**: StoryStream 垂直 feed 样式

### 1.2 Nova 的设计目标

1. **忠实还原**: 严格遵循 The Verge 设计规范
2. **技术适配**: 使用 CSS Variables 实现，便于定制
3. **组件化**: 拆分为独立的 React 组件
4. **响应式**: 支持从 320px 到 1300px+ 的全尺寸

---

## 2. 设计规范对照

### 2.1 色彩系统

| 角色 | 色值 | CSS 变量 | 使用场景 |
| --- | --- | --- | --- |
| Jelly Mint (主强调) | `#3cffd0` | `--nova-jelly-mint` | CTA 按钮、链接下划线、活跃标签边框 |
| Verge Ultraviolet (次强调) | `#5200ff` | `--nova-ultraviolet` | 次级色块、促销标签 |
| Console Mint Border | `#309875` | `--nova-mint-border` | 卡片边框（mint 变体） |
| Deep Link Blue (链接悬停) | `#3860be` | `--nova-deep-link-blue` | 链接悬停色 |
| Focus Cyan | `#1eaedb` | `--nova-focus-cyan` | 按钮焦点环 |
| Purple Rule | `#3d00bf` | `--nova-purple-rule` | StoryStream 垂直边框 |
| Canvas Black (背景) | `#131313` | `--nova-canvas` | 默认深色表面 |
| Surface Slate (次表面) | `#2d2d2d` | `--nova-surface-slate` | 卡片背景、次级容器 |
| Hazard White | `#ffffff` | `--nova-hazard-white` | 卡片边框、主文本 |
| Primary Text | `#ffffff` | `--nova-primary-text` | 标题和显示文本 |
| Secondary Text | `#949494` | `--nova-secondary-text` | 署名、时间戳、照片说明 |
| Muted Text | `#e9e9e9` | `--nova-muted-text` | 深色 slate 按钮文本 |

### 2.2 卡片填充色

| 颜色名称 | 色值                    | CSS 变量             | 说明                  |
| -------- | ----------------------- | -------------------- | --------------------- |
| Mint     | `#3cffd0`               | `--nova-jelly-mint`  | 主强调色填充          |
| Purple   | `rgba(82, 0, 255, 0.9)` | `--nova-ultraviolet` | 紫色填充（0.9 alpha） |
| Yellow   | `#ffd60a`               | `--nova-tile-yellow` | 黄色填充              |
| Pink     | `#ff6b9d`               | `--nova-tile-pink`   | 粉色填充              |
| Orange   | `#ff9500`               | `--nova-tile-orange` | 橙色填充              |
| Blue     | `#0a84ff`               | `--nova-tile-blue`   | 蓝色填充              |

### 2.3 圆角系统

| 用途           | 半径   | CSS 变量                    |
| -------------- | ------ | --------------------------- |
| 输入框、小标签 | `2px`  | `--nova-radius-small`       |
| 内联图片       | `3px`  | `--nova-radius-image`       |
| 嵌套卡片图片   | `4px`  | `--nova-radius-nested`      |
| 标准药丸卡片   | `20px` | `--nova-radius-pill-card`   |
| 功能卡片       | `24px` | `--nova-radius-feature`     |
| 促销按钮       | `30px` | `--nova-radius-promotional` |
| CTA 药丸       | `40px` | `--nova-radius-cta-pill`    |

### 2.4 间距系统

基础单位: **8px**

| Token    | 像素值 | CSS 变量          |
| -------- | ------ | ----------------- |
| space-1  | 4px    | `--nova-space-1`  |
| space-2  | 8px    | `--nova-space-2`  |
| space-3  | 12px   | `--nova-space-3`  |
| space-4  | 16px   | `--nova-space-4`  |
| space-5  | 20px   | `--nova-space-5`  |
| space-6  | 24px   | `--nova-space-6`  |
| space-8  | 32px   | `--nova-space-8`  |
| space-10 | 40px   | `--nova-space-10` |
| space-12 | 48px   | `--nova-space-12` |
| space-16 | 64px   | `--nova-space-16` |

### 2.5 过渡动画

| 类型     | 时长  | CSS 变量                   |
| -------- | ----- | -------------------------- |
| 快速过渡 | 150ms | `--nova-transition-fast`   |
| 正常过渡 | 180ms | `--nova-transition-normal` |

---

## 3. 组件清单

### 3.1 导航组件

#### NovaNavBar

**文件**: `packages/website/themes/nova/NovaNavBar.tsx`

**特性**:

- The Verge 风格大字报 Wordmark
- ALL-CAPS 导航链接 (PolySans Mono)
- 右侧 MANAGE 按钮（薄荷绿药丸）
- 移动端汉堡菜单

**Props**:

| 属性                          | 类型                          | 说明               |
| ----------------------------- | ----------------------------- | ------------------ |
| `logo`                        | `string`                      | Logo 图片 URL      |
| `logoDark`                    | `string`                      | 深色模式 Logo      |
| `siteName`                    | `string`                      | 站点名称           |
| `categories`                  | `string[]`                    | 分类列表           |
| `menus`                       | `MenuItem[]`                  | 菜单项             |
| `setOpen`                     | `(open: boolean) => void`     | 移动端菜单状态     |
| `isOpen`                      | `boolean`                     | 移动端菜单是否展开 |
| `showSubMenu`                 | `"true" \| "false"`           | 显示子菜单         |
| `showAdminButton`             | `"true" \| "false"`           | 显示管理按钮       |
| `showFriends`                 | `"true" \| "false"`           | 显示友链           |
| `showRSS`                     | `"true" \| "false"`           | 显示 RSS           |
| `headerLeftContent`           | `"siteName" \| "siteLogo"`    | 头部左侧内容       |
| `defaultTheme`                | `"dark" \| "auto" \| "light"` | 默认主题           |
| `subMenuOffset`               | `number`                      | 子菜单偏移         |
| `openArticleLinksInNewWindow` | `boolean`                     | 文章链接新窗口打开 |

**CSS 类**:

| 类名                  | 说明                              |
| --------------------- | --------------------------------- |
| `.nova-nav`           | 导航栏容器                        |
| `.nova-nav-inner`     | 导航内部容器（max-width: 1280px） |
| `.nova-nav-wordmark`  | 站点名称/Logo                     |
| `.nova-nav-links`     | 链接容器                          |
| `.nova-nav-link`      | 单个链接                          |
| `.nova-nav-cta`       | CTA 按钮容器                      |
| `.nova-nav-mobile`    | 移动端菜单容器                    |
| `.nova-nav-hamburger` | 汉堡菜单按钮                      |

### 3.2 布局组件

#### NovaLayoutBody

**文件**: `packages/website/themes/nova/NovaLayoutBody.tsx`

**特性**:

- 主内容区 + 侧边栏布局
- 响应式：桌面端并排，移动端堆叠

**Props**:

| 属性       | 类型              | 说明       |
| ---------- | ----------------- | ---------- |
| `children` | `React.ReactNode` | 主内容     |
| `sideBar`  | `React.ReactNode` | 侧边栏内容 |

**CSS 类**:

| 类名                 | 说明                      |
| -------------------- | ------------------------- |
| `.nova-container`    | 容器（max-width: 1280px） |
| `.nova-layout-body`  | 布局主体（flex）          |
| `.nova-main-content` | 主内容区                  |
| `.nova-sidebar`      | 侧边栏（320px 宽）        |

### 3.3 页脚组件

#### NovaFooter

**文件**: `packages/website/themes/nova/NovaFooter.tsx`

**特性**:

- Mono 字体的版权信息
- IPC 备案号链接
- 公安备案号
- 版本号显示

**Props**:

| 属性             | 类型     | 说明          |
| ---------------- | -------- | ------------- |
| `ipcNumber`      | `string` | ICP 备案号    |
| `ipcHref`        | `string` | ICP 备案链接  |
| `since`          | `string` | 起始年份      |
| `version`        | `string` | 版本号        |
| `gaBeianLogoUrl` | `string` | 公安备案 Logo |
| `gaBeianNumber`  | `string` | 公安备案号    |
| `gaBeianUrl`     | `string` | 公安备案链接  |

**CSS 类**:

| 类名                 | 说明     |
| -------------------- | -------- |
| `.nova-footer`       | 页脚容器 |
| `.nova-footer-inner` | 页脚内部 |
| `.nova-footer-text`  | 文本样式 |

### 3.4 卡片组件

#### NovaArticleCard

**文件**: `packages/website/themes/nova/NovaArticleCard.tsx`

**特性**:

- 随机彩色填充卡片
- 悬停时标题变色
- 标签显示
- 预计阅读时间

**Props**:

| 属性          | 类型       | 说明     |
| ------------- | ---------- | -------- |
| `id`          | `string`   | 文章 ID  |
| `title`       | `string`   | 文章标题 |
| `pathname`    | `string`   | 文章路径 |
| `description` | `string`   | 文章描述 |
| `date`        | `string`   | 发布日期 |
| `thumb`       | `string`   | 缩略图   |
| `tags`        | `string[]` | 标签列表 |
| `category`    | `string`   | 分类     |
| `words`       | `number`   | 字数     |

**CSS 类**:

| 类名                  | 说明       |
| --------------------- | ---------- |
| `.nova-card`          | 基础卡片   |
| `.nova-card-feature`  | 功能卡片   |
| `.nova-card-accent-*` | 强调色变体 |
| `.nova-card-headline` | 标题       |
| `.nova-card-body`     | 描述文本   |
| `.nova-card-kicker`   | 类别标签   |
| `.nova-card-footer`   | 底部区域   |

#### NovaArticleList & NovaArticleItem

简化版文章列表展示：

```typescript
// 用法示例
<NovaArticleList>
  <NovaArticleItem
    id="1"
    title="文章标题"
    pathname="article-slug"
    description="描述"
    date="2024-01-01"
    thumb="/thumb.jpg"
    category="分类"
  />
</NovaArticleList>
```

### 3.5 时间线组件

#### NovaTimeline

**文件**: `packages/website/themes/nova/NovaTimeline.tsx`

**特性**:

- StoryStream 垂直时间线
- 左侧时间戳 (HH:mm)
- 垂直虚线/实线连接

**CSS 类**:

| 类名                          | 说明         |
| ----------------------------- | ------------ |
| `.nova-timeline`              | 时间线容器   |
| `.nova-timeline::before`      | 垂直连接线   |
| `.nova-timeline-item`         | 单个时间线项 |
| `.nova-timeline-item::before` | 时间线圆点   |
| `.nova-timeline-timestamp`    | 时间戳标签   |

### 3.6 作者卡片

#### NovaAuthorCard

**文件**: `packages/website/themes/nova/NovaAuthorCard.tsx`

**CSS 类**:

| 类名                  | 说明              |
| --------------------- | ----------------- |
| `.nova-author-card`   | 卡片容器          |
| `.nova-author-avatar` | 头像（80px 圆形） |
| `.nova-author-name`   | 名称              |
| `.nova-author-desc`   | 描述              |

---

## 4. 样式表结构

**文件**: `packages/website/themes/nova/styles/nova.css`

### 4.1 章节索引

| 章节                    | 行数      | 内容           |
| ----------------------- | --------- | -------------- |
| 1. CSS Variables        | 1-62      | 全部设计 Token |
| 2. Base Styles          | 64-74     | 基础样式       |
| 3. Typography           | 76-145    | 字体系统       |
| 4. Buttons              | 147-208   | 按钮样式       |
| 5. Cards & Story Tiles  | 210-295   | 卡片系统       |
| 6. StoryStream Timeline | 297-352   | 时间线样式     |
| 7. Navigation           | 354-448   | 导航样式       |
| 8. Article List         | 450-529   | 文章列表       |
| 9. Footer               | 531-563   | 页脚样式       |
| 10. Layout              | 565-598   | 布局工具       |
| 11. Tags & Categories   | 600-634   | 标签分类       |
| 12. Utilities           | 636-681   | 工具类         |
| 13. Animations          | 683-699   | 动画           |
| 14. Author Card         | 701-730   | 作者卡片       |
| 15. Special Components  | 732-784   | 特殊组件       |
| 16. Dark Mode           | 786-791   | 强制暗色模式   |
| 17. Responsive          | 793-859   | 响应式断点     |
| 18. Link Card           | 860-920   | 友链卡片       |
| 19. Key Card            | 921-955   | 快捷键提示     |
| 20. Search Card         | 956-1070  | 搜索弹窗       |
| 21. Alert Card          | 1071-1100 | 过期提醒       |
| 22. Social Card         | 1101-1142 | 社交卡片       |
| 23. Post Card           | 1143-1220 | 文章详情卡片   |
| 24. Post Title          | 1221-1280 | 标题子标题     |
| 25. Markdown Content    | 1281-1318 | Markdown 样式  |
| 26. CSS Override        | 1319-1420 | 默认组件覆盖   |

---

## 5. 使用指南

### 5.1 全局样式导入

**文件**: `packages/website/pages/_app.tsx`

```typescript
import '../themes/nova/styles/nova.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

### 5.2 主题组件使用

```typescript
import { novaTheme } from './themes/nova/theme';
import { defaultTheme } from './themes/default/theme';

const themesComponents = {
  default: defaultTheme.components,
  nova: novaTheme.components,
};

// 根据主题名称获取组件
const NavBar = themesComponents[themeName].NavBar;
```

### 5.3 自定义颜色

在 `nova.css` 中覆盖 CSS 变量：

```css
:root {
  /* 修改主色调 */
  --nova-jelly-mint: #00ff99;
  --nova-ultraviolet: #6200ea;

  /* 修改背景色 */
  --nova-canvas: #0a0a0a;
}
```

### 5.4 响应式断点

| 断点         | 宽度       | 主要变化               |
| ------------ | ---------- | ---------------------- |
| Desktop      | > 1024px   | 完整布局，侧边栏 320px |
| Tablet       | 768-1024px | 侧边栏堆叠到底部       |
| Mobile       | < 768px    | 单列，汉堡菜单         |
| Small Mobile | < 480px    | 更紧凑的间距           |

---

## 6. 设计合规检查清单

按照 The Verge 设计规范开发，Nova 主题已实现：

- [x] Canvas Black (`#131313`) 作为唯一背景
- [x] Jelly Mint (`#3cffd0`) 作为主强调色
- [x] Verge Ultraviolet (`#5200ff`) 作为次强调色
- [x] ALL-CAPS Mono 标签和时间戳
- [x] 药丸卡片 20px 圆角
- [x] 饱和色块填充卡片 (mint, purple, yellow, pink, orange, blue)
- [x] 悬停时链接变为 Deep Link Blue (`#3860be`)
- [x] StoryStream 时间线样式
- [x] 1px 边框做深度（无阴影）
- [x] 移动端响应式（320px - 1300px+）
- [x] 无渐变，纯色块设计

---

## 7. 文件列表

| 文件                              | 行数  | 说明                                  |
| --------------------------------- | ----- | ------------------------------------- |
| `themes/nova/theme.ts`            | 42    | 主题入口                              |
| `themes/nova/NovaNavBar.tsx`      | 73    | 导航栏                                |
| `themes/nova/NovaLayoutBody.tsx`  | 21    | 布局组件                              |
| `themes/nova/NovaFooter.tsx`      | 59    | 页脚                                  |
| `themes/nova/NovaArticleCard.tsx` | 97    | 文章卡片 (含 ArticleList/ArticleItem) |
| `themes/nova/NovaPostCard.tsx`    | 128   | 文章详情卡片                          |
| `themes/nova/NovaTimeline.tsx`    | 52    | 时间线 (含 TimelineItem)              |
| `themes/nova/NovaAuthorCard.tsx`  | 19    | 作者卡片                              |
| `themes/nova/NovaLinkCard.tsx`    | 27    | 友链卡片                              |
| `themes/nova/NovaSearchCard.tsx`  | 130   | 搜索弹窗                              |
| `themes/nova/NovaKeyCard.tsx`     | 35    | 快捷键提示                            |
| `themes/nova/NovaAlertCard.tsx`   | 26    | 过期提醒                              |
| `themes/nova/NovaSocialCard.tsx`  | 52    | 社交卡片                              |
| `themes/nova/styles/nova.css`     | 1420+ | 完整样式                              |

**总计**: 约 2200+ 行代码

---

**文档版本**: 1.1.0 **创建日期**: 2026-04-19 **最后更新**: 2026-04-19 22:43 **更新内容**: 添加 CSS Override 策略、所有侧边栏组件、PostCard 组件 **参考规范**: [The Verge Design System](../../The-Verge-DESIGN.md)
