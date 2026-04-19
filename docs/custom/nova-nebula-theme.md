# Nova Nebula 主题文档

> Nova Nebula 主题是基于 Nova 主题衍生的 Premium Cosmic 风格主题，灵感来自 Apple Keynote 视觉、OpenAI Premium Branding 和 Luxury Futuristic 网站设计。

---

## 1. 设计理念

### 1.1 设计灵感

- **Apple Keynote Visuals** - 简洁优雅的深色渐变背景
- **OpenAI Premium Branding** - 高端科技感
- **Luxury Futuristic Website Design** - 未来奢华风格
- **Premium AI Landing Page** - 蓝色等离子星云效果

### 1.2 Nova Nebula 的设计目标

1. **Premium 感**: 深邃的宇宙背景配合柔和的光晕
2. **科技感**: 蓝色/紫色星云 + 发光粒子
3. **优雅**: 低对比度、精致、现代
4. **兼容性**: 复用 Nova 组件结构，仅改变视觉效果

---

## 2. 设计规范

### 2.1 色彩系统

| 角色                   | 色值                    | CSS 变量                | 使用场景           |
| ---------------------- | ----------------------- | ----------------------- | ------------------ |
| Jelly Mint (主强调)    | `#3cffd0`               | `--nova-jelly-mint`     | 链接、按钮高亮     |
| Nebula Blue (星云蓝)   | `#0a4a8a`               | `--nebula-blue`         | 蓝色光晕基础       |
| Nebula Violet (星云紫) | `#2d1b4e`               | `--nebula-violet`       | 紫色星云基础       |
| Nebula Cyan (星云青)   | `#0ea5e9`               | `--nebula-cyan`         | 粒子、悬停效果     |
| Nebula Glow            | `rgba(14,165,233,0.15)` | `--nebula-glow`         | 蓝色光晕           |
| Nebula Violet Glow     | `rgba(139,92,246,0.12)` | `--nebula-violet-glow`  | 紫色光晕           |
| Canvas Black (背景)    | `#050508`               | `--nova-canvas`         | 深层黑色背景       |
| Surface Slate (次表面) | `#0d0d12`               | `--nova-surface-slate`  | 卡片背景           |
| Primary Text           | `#f8fafc`               | `--nova-primary-text`   | 主文本（更亮）     |
| Secondary Text         | `#94a3b8`               | `--nova-secondary-text` | 次级文本（更柔和） |

### 2.2 视觉效果

#### 背景层

```css
/* 主背景 - 深层黑色渐变 */
background:
  radial-gradient(ellipse 80% 50% at 50% -20%, rgba(10, 74, 138, 0.25) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 80% 100%, rgba(45, 27, 78, 0.2) 0%, transparent 50%),
  radial-gradient(ellipse 100% 80% at 20% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
  linear-gradient(180deg, #050508 0%, #0a0a12 50%, #050508 100%);
```

#### 发光粒子

12 个漂浮的发光粒子，随机分布，缓慢上升动画：

```css
/* 粒子使用 radial-gradient 实现 */
radial-gradient(1.5px 1.5px at 40% 35%, rgba(14, 165, 233, 0.7) 0%, transparent 100%)
```

#### 脉动光球

3 个大型模糊光球，缓慢脉动：

```css
/* 蓝色光球 - 左上 */
radial-gradient(ellipse 400px 300px at 15% 25%, rgba(14, 165, 233, 0.08) 0%, transparent 70%)

/* 紫色光球 - 右下 */
radial-gradient(ellipse 500px 400px at 85% 75%, rgba(139, 92, 246, 0.06) 0%, transparent 70%)
```

### 2.3 组件样式变化

| 组件     | Nova           | Nova Nebula                       |
| -------- | -------------- | --------------------------------- |
| 背景     | `#131313` 实色 | `#050508` 渐变 + 星云             |
| 卡片背景 | `#131313` 实色 | `rgba(13,13,18,0.7)` 半透明       |
| 卡片边框 | `#ffffff` 白色 | `rgba(255,255,255,0.06)` 微妙边框 |
| 卡片效果 | 无             | `backdrop-filter: blur(10px)`     |
| 悬停效果 | 边框高亮       | 边框 + 柔和发光                   |
| 导航栏   | `#131313` 实色 | `rgba(5,5,8,0.85)` 磨砂玻璃       |
| 页脚     | `#131313` 实色 | `rgba(5,5,8,0.9)` 磨砂玻璃        |

---

## 3. 组件结构

Nova Nebula 复用 Nova 主题的所有组件，仅 CSS 不同：

```
packages/website/themes/nova-nebula/
├── theme.ts              # 主题入口
├── NovaNavBar.tsx        # 导航栏
├── NovaLayoutBody.tsx    # 布局组件
├── NovaFooter.tsx        # 页脚
├── NovaAuthorCard.tsx    # 作者卡片
├── NovaArticleCard.tsx   # 文章卡片
├── NovaPostCard.tsx      # 文章详情
├── NovaTimeline.tsx      # 时间线
├── NovaLinkCard.tsx      # 友链卡片
├── NovaSearchCard.tsx    # 搜索弹窗
├── NovaKeyCard.tsx       # 快捷键提示
├── NovaAlertCard.tsx     # 过期提醒
├── NovaSocialCard.tsx    # 社交图标
└── styles/
    └── nova.css          # Nebula 样式 (1896+ 行)
```

---

## 4. CSS 架构

### 4.1 文件结构 (1896 行)

```
nova.css 章节索引:
1.  CSS Variables (Nebula Cosmic Palette) - 68 行
2.  Base Styles with Nebula Background - 150+ 行
3.  Typography - 继续使用 Nova 字体系统
4.  Buttons - 同 Nova
5.  Cards & Story Tiles - 添加 backdrop-filter
6.  StoryStream Timeline - 添加磨砂效果
7.  Navigation - 磨砂玻璃导航栏
8.  Article List - 半透明卡片
9.  Footer - 磨砂玻璃页脚
10. Layout - 容器 z-index 调整
11. Tags & Categories - 同 Nova
12. Utilities - 同 Nova
13. Animations - particles + glow 动画
14. Author Card - 头像发光效果
15. Special Components - 同 Nova
16. Dark Mode - 始终深色
17. Responsive - 同 Nova
18-26. 各类组件覆盖样式
27. 404 Page Overrides - 特殊处理
```

### 4.2 关键 CSS 变量

```css
:root {
  /* Nebula 专属变量 */
  --nebula-blue: #0a4a8a;
  --nebula-violet: #2d1b4e;
  --nebula-cyan: #0ea5e9;
  --nebula-glow: rgba(14, 165, 233, 0.15);
  --nebula-violet-glow: rgba(139, 92, 246, 0.12);

  /* 覆盖的深色变量 */
  --nova-canvas: #050508;
  --nova-surface-slate: #0d0d12;
  --nova-primary-text: #f8fafc;
  --nova-secondary-text: #94a3b8;
}
```

### 4.3 动画关键帧

```css
/* 粒子漂浮动画 */
@keyframes nova-float-particles {
  0%,
  100% {
    transform: translateY(0) translateX(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-30px) translateX(15px);
    opacity: 0.6;
  }
}

/* 星云脉动动画 */
@keyframes nova-pulse-nebula {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}
```

---

## 5. 使用方式

### 5.1 选择 Nova Nebula 主题

在后台 **System Config → Advance → 主题设置** 中选择 **Nova Nebula 主题**。

### 5.2 触发重建

切换主题后需要手动触发 **静态页面更新** 以使更改生效。

### 5.3 预览效果

访问任意前台页面即可看到 Nova Nebula 的 Premium Cosmic 背景效果。

---

## 6. 与 Nova 的区别

| 特性     | Nova               | Nova Nebula                   |
| -------- | ------------------ | ----------------------------- |
| 设计风格 | The Verge 杂志风格 | Premium Cosmic 宇宙风         |
| 背景     | 深灰 `#131313`     | 深黑渐变 + 星云               |
| 边框     | 白色 `#ffffff`     | 微妙 `rgba(255,255,255,0.06)` |
| 卡片     | 实色背景           | 半透明 + blur                 |
| 粒子     | 无                 | 12 个漂浮发光粒子             |
| 光球     | 无                 | 3 个脉动模糊光球              |
| 适用场景 | 新闻/科技博客      | AI/科技/创意作品集            |

---

## 7. 自定义建议

### 7.1 调整星云颜色

修改 `--nebula-blue` 和 `--nebula-violet` 可改变整体色调：

```css
--nebula-blue: #1a5f7a; /* 更偏青色 */
--nebula-violet: #4a1942; /* 更偏紫红色 */
```

### 7.2 调整粒子密度

修改 `::before` 伪元素中的粒子数量和透明度。

### 7.3 调整光球大小

修改 `::after` 伪元素中的 `ellipse` 尺寸。

### 7.4 Footer 发光线条

Footer 使用透明背景 + 发光线条效果：

```css
.nova-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(14, 165, 233, 0.4) 20%,
    rgba(14, 165, 233, 0.6) 50%,
    rgba(14, 165, 233, 0.4) 80%,
    transparent 100%
  );
  box-shadow:
    0 0 10px rgba(14, 165, 233, 0.3),
    0 0 20px rgba(14, 165, 233, 0.2),
    0 0 30px rgba(14, 165, 233, 0.1);
}
```

---

**文档版本**: 1.0.2 **创建日期**: 2026-04-20 **最后更新**: 2026-04-20 00:32

**更新内容**: 主题隔离修复 - CSS 选择器完整前缀
