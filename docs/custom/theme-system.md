# 主题系统实现文档

> 此文档记录了为 VanBlog 添加主题系统框架的完整过程，包括设计思路、技术实现、文件变更和集成细节。

---

## 1. 需求背景

### 1.1 背景说明

VanBlog 原作者已停更多年，用户希望在不破坏现有功能的前提下：

1. 能够更新依赖和组件
2. 支持自定义主题系统，允许用户更换博客前台主题
3. 在后台管理系统中添加主题切换功能

### 1.2 设计目标

- **最小侵入性**: 不修改原有组件，通过主题目录隔离新主题
- **易于扩展**: 方便添加新主题
- **用户友好**: 后台可一键切换主题
- **构建兼容**: 支持 Docker 构建和 ISR 静态渲染

---

## 2. 设计思路

### 2.1 整体架构

采用**主题目录 + 动态加载**的方案：

```
packages/website/
├── themes/                    # 主题根目录
│   ├── types.ts              # 主题类型定义（共享接口）
│   ├── index.ts              # 主题加载器（注册 & 动态导入）
│   ├── ThemeContext.tsx      # 主题上下文（预留）
│   │
│   ├── default/              # 默认主题
│   │   └── theme.ts          # 默认主题入口（复用现有组件）
│   │
│   └── nova/                 # Nova 主题（新开发）
│       ├── theme.ts          # Nova 主题入口
│       ├── NovaNavBar.tsx    # 导航栏组件
│       ├── NovaLayoutBody.tsx
│       ├── NovaFooter.tsx
│       ├── NovaAuthorCard.tsx
│       ├── NovaArticleCard.tsx
│       ├── NovaTimeline.tsx
│       └── styles/
│           └── nova.css      # 859 行，The Verge 风格样式
│
└── components/               # 原有组件保持不变
    ├── Layout/
    ├── NavBar/
    ├── LayoutBody/
    └── Footer/
```

### 2.2 主题接口设计

**文件**: `packages/website/themes/types.ts`

```typescript
/**
 * 主题配置信息
 */
export interface ThemeConfig {
  name: string; // 主题唯一标识
  description?: string; // 主题描述
  version?: string; // 主题版本
  author?: string; // 主题作者
}

/**
 * 主题组件映射
 * key: 组件名称（如 NavBar, LayoutBody, Footer）
 * value: React 组件类型
 */
export interface ThemeComponents {
  [key: string]: React.ComponentType<any> | undefined;
}

/**
 * 完整主题对象
 */
export interface Theme {
  config: ThemeConfig;
  components: ThemeComponents;
}

/**
 * 主题名称类型
 */
export type ThemeName = 'default' | 'nova' | string;
```

### 2.3 主题加载机制

**文件**: `packages/website/themes/index.ts`

```typescript
import { Theme, ThemeName } from './types';

const themes: Record<ThemeName, () => Promise<Theme>> = {
  // 默认主题：复用现有组件
  default: () => import('./default/theme').then((m) => m.defaultTheme),

  // Nova 主题：The Verge 风格
  nova: () => import('./nova/theme').then((m) => m.novaTheme),
};

/**
 * 动态加载指定主题
 * @param name 主题名称
 * @returns 主题对象
 */
export async function loadTheme(name: ThemeName): Promise<Theme> {
  const loader = themes[name];
  if (!loader) {
    console.warn(`Theme "${name}" not found, falling back to default`);
    return loadTheme('default');
  }
  return loader();
}

/**
 * 获取已注册的主题列表
 */
export function getAvailableThemes(): ThemeName[] {
  return Object.keys(themes);
}
```

### 2.4 数据流设计

```
┌─────────────────────────────────────────────────────────────────┐
│                         管理员操作                               │
│  后台 SystemConfig → Advance → 主题设置 → 选择 "Nova" → 保存    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API 请求                                    │
│  PUT /api/admin/setting/theme                                   │
│  Body: { "theme": "nova" }                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MongoDB 存储                                │
│  Collection: setting                                            │
│  Document: { type: "theme", value: { theme: "nova" } }          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ISR 静态页面重建                              │
│  Next.js getStaticProps → /api/public/meta → { theme: "nova" } │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    前台 Layout 组件                              │
│  props.option.theme = "nova"                                    │
│  → themeComponents = themesComponents["nova"]                  │
│  → 渲染 NovaNavBar, NovaLayoutBody, NovaFooter                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 服务端实现

### 3.1 类型定义

**文件**: `packages/server/src/types/setting.dto.ts`

**新增内容**:

```typescript
// 1. 在 SettingType 中添加 'theme'
export type SettingType =
  | 'static'
  | 'https'
  | 'waline'
  | 'layout'
  | 'login'
  | 'menu'
  | 'version'
  | 'isr'
  | 'theme'; // ← 新增

// 2. 新增 ThemeSetting 接口
export interface ThemeSetting {
  theme: string;
}
```

### 3.2 Provider 层

**文件**: `packages/server/src/provider/setting/setting.provider.ts`

**新增方法**:

```typescript
/**
 * 获取主题设置
 * @returns 主题配置，默认返回 { theme: 'default' }
 */
async getThemeSetting(): Promise<{ theme: string }> {
  const res = await this.settingModel.findOne({ type: 'theme' }).exec();
  if (res) {
    return res?.value as { theme: string };
  } else {
    // 不存在则创建默认配置
    await this.settingModel.create({
      type: 'theme',
      value: { theme: 'default' },
    });
    return { theme: 'default' };
  }
}

/**
 * 更新主题设置
 * @param dto 包含 theme 字段的对象
 */
async updateThemeSetting(dto: { theme: string }) {
  const oldValue = await this.getThemeSetting();
  const newValue = { ...oldValue, ...dto };

  await this.settingModel.findOneAndUpdate(
    { type: 'theme' },
    { value: newValue },
    { upsert: true }
  );

  return newValue;
}
```

### 3.3 Admin Controller

**文件**: `packages/server/src/controller/admin/setting/setting.controller.ts`

**新增端点**:

```typescript
@Get('theme')
async getThemeSetting() {
  const res = await this.settingProvider.getThemeSetting();
  return { statusCode: 200, data: res };
}

@Put('theme')
async updateThemeSetting(@Body() body: { theme: string }) {
  await this.settingProvider.updateThemeSetting(body);
  return { statusCode: 200, message: '更新成功' };
}
```

### 3.4 Public API

**文件**: `packages/server/src/controller/public/public.controller.ts`

在 `GET /api/public/meta` 响应中添加 `theme` 字段：

```typescript
// 获取主题设置
const themeSetting = await this.settingProvider.getThemeSetting();

// 构建响应数据
const data = {
  // ... 其他字段
  title: info.title,
  description: info.description,
  logo: info.logo,
  // ...
  // 新增 theme 字段
  ...(themeSetting ? { theme: themeSetting.theme } : {}),
};

return { statusCode: 200, data };
```

---

## 4. 前台 (website) 实现

### 4.1 主题类型定义

**文件**: `packages/website/themes/types.ts`

```typescript
// 详见 2.2 节
```

### 4.2 主题加载器

**文件**: `packages/website/themes/index.ts`

```typescript
// 详见 2.3 节
```

### 4.3 主题入口文件

**文件**: `packages/website/themes/default/theme.ts`

```typescript
import Layout from '../../components/Layout';
import LayoutBody from '../../components/LayoutBody';
import NavBar from '../../components/NavBar';
import NavBarMobile from '../../components/NavBarMobile';
import Footer from '../../components/Footer';
import AuthorCard from '../../components/AuthorCard';
import ArticleCard from '../../components/ArticleCard';
import PostCard from '../../components/PostCard';
import TimeLineItem from '../../components/TimeLineItem';
import LinkCard from '../../components/LinkCard';
import SearchCard from '../../components/SearchCard';
import KeyCard from '../../components/KeyCard';
import AlertCard from '../../components/AlertCard';
import SocialCard from '../../components/SocialCard';
import { Theme } from '../types';

export const defaultTheme: Theme = {
  config: {
    name: 'default',
    description: 'VanBlog 默认主题',
    version: '1.0.0',
    author: 'Mereith',
  },
  components: {
    Layout,
    LayoutBody,
    NavBar,
    NavBarMobile,
    Footer,
    AuthorCard,
    ArticleList: ArticleCard,
    PostCard,
    TimeLineItem,
    LinkCard,
    SearchCard,
    KeyCard,
    AlertCard,
    SocialCard,
  },
};
```

**文件**: `packages/website/themes/nova/theme.ts`

```typescript
import Layout from '../../components/Layout'; // 复用 Layout 容器
import LayoutBody from './NovaLayoutBody'; // Nova 专属
import NavBar from './NovaNavBar'; // Nova 专属
import NavBarMobile from '../../components/NavBarMobile';
import Footer from './NovaFooter'; // Nova 专属
import AuthorCard from './NovaAuthorCard'; // Nova 专属
import ArticleList from './NovaArticleCard'; // Nova 专属
import PostCard from './NovaArticleCard'; // Nova 专属
import { NovaTimelineItem } from './NovaTimeline'; // Nova 专属
import LinkCard from '../../components/LinkCard';
import SearchCard from '../../components/SearchCard';
import KeyCard from '../../components/KeyCard';
import AlertCard from '../../components/AlertCard';
import SocialCard from '../../components/SocialCard';
import { Theme } from '../types';

export const novaTheme: Theme = {
  config: {
    name: 'nova',
    description: 'VanBlog Nova 主题 - The Verge 风格',
    version: '1.0.0',
    author: 'Custom',
  },
  components: {
    Layout,
    LayoutBody,
    NavBar,
    NavBarMobile,
    Footer,
    AuthorCard,
    ArticleList,
    PostCard,
    TimeLineItem: NovaTimelineItem,
    LinkCard,
    SearchCard,
    KeyCard,
    AlertCard,
    SocialCard,
  },
};
```

### 4.4 API 数据结构更新

**文件**: `packages/website/api/getAllData.ts`

```typescript
export interface PublicMetaProp {
  // ... 原有字段
  title?: string;
  description?: string;
  logo?: string;
  // ...

  // 新增 theme 字段
  theme?: string;
}
```

### 4.5 Layout Props 更新

**文件**: `packages/website/utils/getLayoutProps.ts`

```typescript
export interface LayoutProps {
  // ... 原有字段
  title?: string;
  description?: string;
  // ...

  // 新增 theme 字段
  theme?: string;
}

export function getLayoutProps(data: PublicMetaProp): LayoutProps {
  return {
    // ... 原有字段
    title: data?.title,
    description: data?.description,
    // ...

    // 新增
    theme: data?.theme || 'default',
  };
}
```

---

## 5. 后台 (admin) 实现

### 5.1 API 客户端

**文件**: `packages/admin/src/services/van-blog/api.js`

```javascript
/**
 * 获取主题配置
 */
export async function getThemeConfig() {
  return request('/api/admin/setting/theme', {
    method: 'GET',
  });
}

/**
 * 更新主题配置
 * @param {Object} body - 请求体
 * @param {string} body.theme - 主题名称
 */
export async function updateThemeConfig(body) {
  return request('/api/admin/setting/theme', {
    method: 'PUT',
    data: body,
  });
}
```

### 5.2 主题设置界面

**文件**: `packages/admin/src/pages/SystemConfig/tabs/Advance.jsx`

在"高级设置"页面底部添加主题设置卡片：

```typescript
<Card title="主题设置" style={{ marginTop: 8 }}>
  <Alert
    type="info"
    message="选择前台博客使用的主题。切换主题后需要手动触发静态页面更新以生效。"
  />
  <ProForm
    request={async () => {
      try {
        const { data } = await getThemeConfig();
        return data || { theme: 'default' };
      } catch (e) {
        return { theme: 'default' };
      }
    }}
    onFinish={async (values) => {
      try {
        await updateThemeConfig(values);
        message.success('更新成功！');
      } catch (e) {
        message.error('更新失败');
      }
    }}
  >
    <ProFormSelect
      name="theme"
      label="前台主题"
      fieldProps={{
        options: [
          { label: '默认主题', value: 'default' },
          { label: 'Nova 主题', value: 'nova' },
        ],
      }}
      rules={[{ required: true, message: '请选择主题' }]}
    />
  </ProForm>
</Card>
```

---

## 6. Layout 组件集成

**文件**: `packages/website/components/Layout/index.tsx`

这是主题切换的核心集成点：

```typescript
import React from 'react';
import defaultTheme from "../../themes/default/theme";
import novaTheme from "../../themes/nova/theme";
import { ThemeComponents } from "../../themes/types";
import { LayoutProps } from "../../utils/getLayoutProps";

// 主题组件映射表
const themesComponents: Record<string, ThemeComponents> = {
  default: defaultTheme.components,
  nova: novaTheme.components,
};

export default function Layout(props: LayoutProps & { option: LayoutProps }) {
  // 从 props.option 获取主题名称
  const themeName = props.option.theme || 'default';

  // 获取对应主题的组件映射
  const themeComponents = themesComponents[themeName] || themesComponents.default;

  // 从主题获取组件，带 fallback 到默认主题
  const NavBarComponent = themeComponents.NavBar || defaultTheme.components.NavBar;
  const NavBarMobileComponent = themeComponents.NavBarMobile || defaultTheme.components.NavBarMobile;
  const LayoutBodyComponent = themeComponents.LayoutBody || defaultTheme.components.LayoutBody;
  const FooterComponent = themeComponents.Footer || defaultTheme.components.Footer;
  const AuthorCardComponent = themeComponents.AuthorCard || defaultTheme.components.AuthorCard;
  const ArticleListComponent = themeComponents.ArticleList || defaultTheme.components.ArticleList;
  const PostCardComponent = themeComponents.PostCard || defaultTheme.components.PostCard;
  const TimeLineItemComponent = themeComponents.TimeLineItem || defaultTheme.components.TimeLineItem;
  const LinkCardComponent = themeComponents.LinkCard || defaultTheme.components.LinkCard;
  const SearchCardComponent = themeComponents.SearchCard || defaultTheme.components.SearchCard;
  const KeyCardComponent = themeComponents.KeyCard || defaultTheme.components.KeyCard;
  const AlertCardComponent = themeComponents.AlertCard || defaultTheme.components.AlertCard;
  const SocialCardComponent = themeComponents.SocialCard || defaultTheme.components.SocialCard;

  // ... 其他逻辑

  return (
    <>
      <NavBarComponent {...props} />
      <LayoutBodyComponent {...props}>
        {/* children */}
      </LayoutBodyComponent>
      <FooterComponent {...props} />
    </>
  );
}
```

---

## 7. 文件变更清单

### 7.1 新增文件

| 文件路径                                           | 说明                          |
| -------------------------------------------------- | ----------------------------- |
| `packages/website/themes/types.ts`                 | 主题类型定义（共享接口）      |
| `packages/website/themes/index.ts`                 | 主题加载器（注册 & 动态导入） |
| `packages/website/themes/ThemeContext.tsx`         | 主题上下文（预留）            |
| `packages/website/themes/default/theme.ts`         | 默认主题入口                  |
| `packages/website/themes/nova/theme.ts`            | Nova 主题入口                 |
| `packages/website/themes/nova/NovaNavBar.tsx`      | Nova 导航栏组件               |
| `packages/website/themes/nova/NovaLayoutBody.tsx`  | Nova 主体布局组件             |
| `packages/website/themes/nova/NovaFooter.tsx`      | Nova 页脚组件                 |
| `packages/website/themes/nova/NovaAuthorCard.tsx`  | Nova 作者卡片组件             |
| `packages/website/themes/nova/NovaArticleCard.tsx` | Nova 文章卡片组件             |
| `packages/website/themes/nova/NovaTimeline.tsx`    | Nova 时间线组件               |
| `packages/website/themes/nova/styles/nova.css`     | Nova 主题样式（859 行）       |

### 7.2 修改文件

#### 服务端 (packages/server)

| 文件 | 修改内容 |
| --- | --- |
| `src/types/setting.dto.ts` | 添加 `ThemeSetting` 接口和 `theme` setting type |
| `src/provider/setting/setting.provider.ts` | 添加 `getThemeSetting()` 和 `updateThemeSetting()` 方法 |
| `src/controller/admin/setting/setting.controller.ts` | 添加 `GET/PUT /api/admin/setting/theme` 端点 |
| `src/controller/public/public.controller.ts` | 在 meta API 中返回 `theme` 字段 |

#### 前台 (packages/website)

| 文件                          | 修改内容                                                 |
| ----------------------------- | -------------------------------------------------------- |
| `api/getAllData.ts`           | 在 `PublicMetaProp` 添加 `theme` 字段                    |
| `utils/getLayoutProps.ts`     | 在 `LayoutProps` 和 `getLayoutProps` 中添加 `theme` 字段 |
| `components/Layout/index.tsx` | 实现主题组件动态加载逻辑，支持 nova-nebula               |
| `pages/_app.tsx`              | 导入 nova.css 和 nova-nebula.css 样式文件                |
| `pages/404.tsx`               | 添加 getStaticProps 获取 theme，应用主题样式             |

#### 后台 (packages/admin)

| 文件                                      | 修改内容                                         |
| ----------------------------------------- | ------------------------------------------------ |
| `src/services/van-blog/api.js`            | 添加 `getThemeConfig()` 和 `updateThemeConfig()` |
| `src/pages/SystemConfig/tabs/Advance.jsx` | 添加主题设置卡片 UI，支持 nova-nebula 选项       |

---

## 8. 已知限制和后续工作

### 8.1 当前状态

| 功能                    | 状态      |
| ----------------------- | --------- |
| 主题框架搭建            | ✅ 已完成 |
| Layout 组件主题动态加载 | ✅ 已完成 |
| 后台主题设置 UI         | ✅ 已完成 |
| 服务端 theme API        | ✅ 已完成 |
| Nova 主题开发           | ✅ 已完成 |
| Nova Nebula 主题开发    | ✅ 已完成 |
| 404 页面主题支持        | ✅ 已完成 |

### 8.2 已知限制

1. **主题预览功能**: 目前切换主题后需要手动触发 ISR 重建才能预览
2. **主题市场**: 暂不支持在线安装主题包
3. **主题配置面板**: 目前主题只有一个 `theme` 字段，不支持主题自定义配置

### 8.3 后续工作建议

1. 添加主题预览功能
2. 支持主题自定义配置（如颜色、字体等）
3. 添加更多预设主题
4. 实现主题市场或主题包上传安装

---

## 9. 测试验证

### 9.1 构建验证

```bash
# Server
cd packages/server && pnpm build
# 预期: ✅ 成功

# Admin
cd packages/admin && pnpm build
# 预期: ✅ 成功

# Website
cd packages/website && pnpm build
# 预期: ✅ 成功（可能有 symlink 警告，可忽略）
```

### 9.2 功能验证清单

- [ ] 后台 System Config → Advance 页面显示主题设置卡片
- [ ] 选择 Nova 主题并保存成功
- [ ] 调用 GET /api/admin/setting/theme 返回正确数据
- [ ] 调用 GET /api/public/meta 返回 theme 字段
- [ ] 前台页面使用 Nova 主题样式渲染
- [ ] Docker 镜像构建成功

---

## 10. 参考资料

- [VanBlog 官方文档](https://vanblog.mereith.com)
- [VanBlog GitHub](https://github.com/mereithhh/van-blog)
- [The Verge Design System](../The-Verge-DESIGN.md)
- [Next.js 主题系统设计](https://nextjs.org/docs/architecture/theming)
- [React 动态组件加载](https://react.dev/reference/react/lazy)

---

**文档版本**: 1.2.0 **创建日期**: 2026-04-19 **最后更新**: 2026-04-19 **更新内容**:

- 完成 Nova 主题集成
- 添加完整文件变更清单
- 添加测试验证清单
