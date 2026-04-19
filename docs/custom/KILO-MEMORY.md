# Kilo AI 记忆存储

> 本文件记录 AI 在本项目中的所有工作进度、设计决策和关键上下文，供后续会话参考。

---

## 项目信息

- **项目**: VanBlog 个人博客系统定制开发
- **用户需求**: 保守更新依赖 + 添加自定义主题系统 + Nova (The Verge 风格) 主题
- **工作模式**: 开发阶段由 AI 负责，测试由用户完成
- **当前时间**: 2026-04-19

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

**组件** (7 个): | 组件 | 行数 | 说明 | | --- | --- | --- | | NovaNavBar | 73 | 大字报 Wordmark + ALL-CAPS 导航 | | NovaLayoutBody | 21 | 主内容 + 侧边栏布局 | | NovaFooter | 59 | Mono 版权信息 | | NovaArticleCard | 97 | 随机彩色填充卡片 | | NovaTimeline | 52 | StoryStream 垂直时间线 | | NovaAuthorCard | 19 | 80px 圆形头像卡片 | | styles/nova.css | 859 | 完整样式 |

**设计规范**:

- Canvas Black (#131313) 背景
- Jelly Mint (#3cffd0) 主强调
- Verge Ultraviolet (#5200ff) 次强调
- 20px 药丸卡片圆角
- 饱和色块填充 (yellow, pink, orange, blue, purple)
- 悬停链接变 Deep Link Blue (#3860be)
- 无阴影，1px 边框做深度

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
docs/custom/nova-theme.md                              # Nova 主题文档
packages/website/themes/types.ts                        # 主题类型定义
packages/website/themes/index.ts                        # 主题加载器
packages/website/themes/ThemeContext.tsx               # 主题上下文
packages/website/themes/default/theme.ts                # 默认主题入口
packages/website/themes/nova/theme.ts                  # Nova 主题入口
packages/website/themes/nova/NovaNavBar.tsx            # Nova 导航栏
packages/website/themes/nova/NovaLayoutBody.tsx       # Nova 布局
packages/website/themes/nova/NovaFooter.tsx            # Nova 页脚
packages/website/themes/nova/NovaAuthorCard.tsx       # Nova 作者卡片
packages/website/themes/nova/NovaArticleCard.tsx       # Nova 文章卡片
packages/website/themes/nova/NovaTimeline.tsx         # Nova 时间线
packages/website/themes/nova/styles/nova.css          # Nova 样式 (859行)
```

### 3.2 修改文件

```
Dockerfile                                              # 添加默认值
docs/custom/README.md                                   # 重写
docs/custom/theme-system.md                             # 更新
docs/custom/dependency-updates.md                        # 已存在
docs/custom/dockerfile-fix.md                           # 已存在
packages/server/src/types/setting.dto.ts                 # 添加 theme type
packages/server/src/provider/setting/setting.provider.ts # 添加 theme 方法
packages/server/src/controller/admin/setting/setting.controller.ts # 添加 API
packages/server/src/controller/public/public.controller.ts # 添加 theme 字段
packages/website/api/getAllData.ts                      # 添加 theme 字段
packages/website/utils/getLayoutProps.ts                 # 添加 theme 字段
packages/website/components/Layout/index.tsx            # 主题动态加载
packages/website/pages/_app.tsx                         # 导入 nova.css
packages/admin/src/services/van-blog/api.js             # 添加 theme API
packages/admin/src/pages/SystemConfig/tabs/Advance.jsx  # 主题设置 UI
```

---

## 四、设计决策记录

### 4.1 为什么用组件映射而不是 Theme Provider？

**原因**:

1. VanBlog 使用 Next.js getStaticProps，数据在构建时确定
2. 组件映射更简单，无需额外 Context
3. 对现有代码侵入性最小

### 4.2 为什么复用 Layout 容器？

**原因**:

- Layout 包含 HTML head、body 结构
- CSS 变量在 nova.css 中定义
- 只需替换内部子组件 (NavBar, LayoutBody, Footer)

### 4.3 为什么 Nova 主题的 Layout 也复用原有组件？

**原因**:

- 保持与默认主题相同的 HTML 结构
- Nova 样式通过 CSS 类名实现
- 避免破坏 SEO 和现有功能

---

## 五、待完成 / 已知问题

### 5.1 未完成

- [ ] GitHub 推送（由用户执行）
- [ ] 测试验证（由用户执行）

### 5.2 已知问题

1. **Windows pnpm symlink 警告**: 不影响代码正确性，Linux 构建无此问题
2. **主题预览**: 切换后需手动触发 ISR 重建
3. **主题配置**: 目前只有 theme 字段，无自定义配置面板

---

## 六、测试验证清单（供用户参考）

- [ ] Server 构建: `cd packages/server && pnpm build`
- [ ] Admin 构建: `cd packages/admin && pnpm build`
- [ ] Website 构建: `cd packages/website && pnpm build`
- [ ] Docker 构建: `docker build -t vanblog:test .`
- [ ] 后台主题设置 UI 是否显示
- [ ] 切换主题后前台是否使用 Nova 样式
- [ ] Nova 主题是否呈现 The Verge 风格（深色背景、薄荷绿强调色）

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

### 7.3 关键文件路径

| 用途        | 路径                                                     |
| ----------- | -------------------------------------------------------- |
| 主题类型    | `packages/website/themes/types.ts`                       |
| 主题加载    | `packages/website/themes/index.ts`                       |
| Layout 集成 | `packages/website/components/Layout/index.tsx`           |
| Nova 样式   | `packages/website/themes/nova/styles/nova.css`           |
| 后台主题 UI | `packages/admin/src/pages/SystemConfig/tabs/Advance.jsx` |
| API 客户端  | `packages/admin/src/services/van-blog/api.js`            |
| 文档目录    | `docs/custom/`                                           |

---

**最后更新**: 2026-04-19 21:41 **维护者**: Kilo AI
