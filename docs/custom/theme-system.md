# 主题系统实现文档

> 此文档记录了为 VanBlog 添加主题系统框架的过程，包括设计思路、技术实现和文件变更。

## 1. 需求背景

VanBlog 原作者已停更多年，用户希望在不破坏现有功能的前提下：

1. 能够更新依赖和组件
2. 支持自定义主题系统，允许用户更换博客前台主题
3. 在后台管理系统中添加主题切换功能

## 2. 设计思路

### 2.1 整体架构

采用**主题目录 + 动态加载**的方案：

```
packages/website/
├── themes/                    # 主题目录
│   ├── types.ts              # 主题类型定义
│   ├── index.ts              # 主题加载器
│   ├── ThemeContext.tsx      # 主题上下文
│   ├── default/              # 默认主题（现有组件）
│   │   └── theme.ts
│   └── nova/                 # 新主题（示例）
│       └── theme.ts
└── components/              # 原有组件保持不变
```

### 2.2 主题接口设计

参考现代前端框架的主题系统，设计了以下接口：

```typescript
interface ThemeConfig {
  name: string;
  description?: string;
  version?: string;
  author?: string;
}

interface ThemeComponents {
  [key: string]: React.ComponentType<any> | undefined;
}

interface Theme {
  config: ThemeConfig;
  components: ThemeComponents;
}
```

### 2.3 数据流设计

```
用户选择主题 → 后台保存到 MongoDB (Setting collection, type='theme')
                 ↓
前端获取 Meta API → 返回 theme 字段
                 ↓
Layout 组件根据 theme 字段 → 动态加载对应主题组件
```

## 3. 技术实现

### 3.1 服务端实现

#### 3.1.1 类型定义

**文件**: `packages/server/src/types/setting.dto.ts`

新增 `ThemeSetting` 接口和 `theme` setting type：

```typescript
// 新增 theme setting type
export type SettingType =
  | 'static'
  | 'https'
  | 'waline'
  | 'layout'
  | 'login'
  | 'menu'
  | 'version'
  | 'isr'
  | 'theme'; // 新增

// 新增 ThemeSetting 类型
export interface ThemeSetting {
  theme: string;
}
```

#### 3.1.2 Provider 层

**文件**: `packages/server/src/provider/setting/setting.provider.ts`

新增两个方法：

```typescript
async getThemeSetting(): Promise<{ theme: string }> {
  const res = await this.settingModel.findOne({ type: 'theme' }).exec();
  if (res) {
    return res?.value as { theme: string };
  } else {
    await this.settingModel.create({
      type: 'theme',
      value: { theme: 'default' },
    });
    return { theme: 'default' };
  }
}

async updateThemeSetting(dto: { theme: string }) {
  const oldValue = await this.getThemeSetting();
  const newValue = { ...oldValue, ...dto };
  // ... update logic
}
```

#### 3.1.3 Controller 层

**文件**: `packages/server/src/controller/admin/setting/setting.controller.ts`

新增两个 API 端点：

```typescript
@Get('theme')
async getThemeSetting() {
  const res = await this.settingProvider.getThemeSetting();
  return { statusCode: 200, data: res };
}

@Put('theme')
async updateThemeSetting(@Body() body: { theme: string }) {
  // ... update logic
}
```

#### 3.1.4 Public API

**文件**: `packages/server/src/controller/public/public.controller.ts`

在 `GET /api/public/meta` 响应中添加 `theme` 字段：

```typescript
const ThemeSetting = await this.settingProvider.getThemeSetting();
const data = {
  // ... other fields
  ...(ThemeSetting ? { theme: ThemeSetting.theme } : {}),
};
```

### 3.2 前台 (website) 实现

#### 3.2.1 主题类型定义

**文件**: `packages/website/themes/types.ts`

```typescript
export interface ThemeConfig {
  name: string;
  description?: string;
  version?: string;
  author?: string;
}

export interface ThemeComponents {
  [key: string]: React.ComponentType<any> | undefined;
}

export interface Theme {
  config: ThemeConfig;
  components: ThemeComponents;
}

export type ThemeName = 'default' | 'nova' | string;
```

#### 3.2.2 主题加载器

**文件**: `packages/website/themes/index.ts`

```typescript
import { Theme, ThemeName } from './types';

const themes: Record<ThemeName, () => Promise<Theme>> = {
  default: () => import('./default/theme').then((m) => m.default),
  nova: () => import('./nova/theme').then((m) => m.default),
};

export async function loadTheme(name: ThemeName): Promise<Theme> {
  const loader = themes[name];
  if (!loader) {
    console.warn(`Theme "${name}" not found, falling back to default`);
    return loadTheme('default');
  }
  return loader();
}
```

#### 3.2.3 主题入口文件

**文件**: `packages/website/themes/default/theme.ts`

```typescript
import Layout from '../../components/Layout';
import LayoutBody from '../../components/LayoutBody';
import NavBar from '../../components/NavBar';
// ... other components
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
    // ... other components
  },
};
```

#### 3.2.4 Theme API 数据结构

**文件**: `packages/website/api/getAllData.ts`

在 `PublicMetaProp` 接口中添加 `theme` 字段：

```typescript
export interface PublicMetaProp {
  // ... existing fields
  theme?: string;
}
```

#### 3.2.5 Layout Props

**文件**: `packages/website/utils/getLayoutProps.ts`

在 `LayoutProps` 接口和 `getLayoutProps` 函数中添加 `theme` 字段：

```typescript
export interface LayoutProps {
  // ... existing fields
  theme?: string;
}

export function getLayoutProps(data: PublicMetaProp): LayoutProps {
  // ...
  return {
    // ... other fields
    theme: data?.theme || 'default',
  };
}
```

### 3.3 后台 (admin) 实现

#### 3.3.1 API 客户端

**文件**: `packages/admin/src/services/van-blog/api.js`

新增两个 API 调用函数：

```javascript
export async function getThemeConfig() {
  return request('/api/admin/setting/theme', {
    method: 'GET',
  });
}

export async function updateThemeConfig(body) {
  return request('/api/admin/setting/theme', {
    method: 'PUT',
    data: body,
  });
}
```

#### 3.3.2 主题设置界面

**文件**: `packages/admin/src/pages/SystemConfig/tabs/Advance.tsx`

在"高级设置"页面中添加主题设置卡片：

```typescript
<Card title="主题设置" style={{ marginTop: 8 }}>
  <Alert
    type="info"
    message="选择前台博客使用的主题。切换主题后需要手动触发静态页面更新以生效。"
  />
  <ProForm
    request={async () => {
      const { data } = await getThemeConfig();
      return data || { theme: 'default' };
    }}
    onFinish={async (data) => {
      await updateThemeConfig(data);
      message.success('更新成功！');
    }}
  >
    <ProFormSelect
      name={'theme'}
      label="前台主题"
      fieldProps={{
        options: [
          { label: '默认主题', value: 'default' },
          { label: 'Nova 主题', value: 'nova' },
        ],
      }}
    />
  </ProForm>
</Card>
```

## 4. 文件变更清单

### 4.1 新增文件

| 文件路径                                   | 说明                     |
| ------------------------------------------ | ------------------------ |
| `packages/website/themes/types.ts`         | 主题类型定义             |
| `packages/website/themes/index.ts`         | 主题加载器               |
| `packages/website/themes/ThemeContext.tsx` | 主题上下文（未完全集成） |
| `packages/website/themes/default/theme.ts` | 默认主题入口             |
| `packages/website/themes/nova/theme.ts`    | Nova 主题入口            |

### 4.2 修改文件

#### 服务端 (packages/server)

| 文件 | 修改内容 |
| --- | --- |
| `src/types/setting.dto.ts` | 添加 `ThemeSetting` 接口和 `theme` setting type |
| `src/provider/setting/setting.provider.ts` | 添加 `getThemeSetting()` 和 `updateThemeSetting()` 方法 |
| `src/controller/admin/setting/setting.controller.ts` | 添加 `GET/PUT /api/admin/setting/theme` 端点 |
| `src/controller/public/public.controller.ts` | 在 meta API 中返回 `theme` 字段 |

#### 前台 (packages/website)

| 文件                      | 修改内容                                                 |
| ------------------------- | -------------------------------------------------------- |
| `api/getAllData.ts`       | 在 `PublicMetaProp` 添加 `theme` 字段                    |
| `utils/getLayoutProps.ts` | 在 `LayoutProps` 和 `getLayoutProps` 中添加 `theme` 字段 |

#### 后台 (packages/admin)

| 文件                                      | 修改内容                                         |
| ----------------------------------------- | ------------------------------------------------ |
| `src/services/van-blog/api.js`            | 添加 `getThemeConfig()` 和 `updateThemeConfig()` |
| `src/pages/SystemConfig/tabs/Advance.jsx` | 添加主题设置卡片 UI                              |

## 5. 已知限制和后续工作

### 5.1 当前限制

1. **主题加载未完全集成**: 当前主题框架已建立，但 Layout 组件尚未根据 `option.theme` 动态加载主题组件。后续需要在 Layout 中实现主题切换逻辑。

2. **Nova 主题是示例**: 目前 nova 主题只是复制了默认主题的组件，后续需要开发真正不同的主题样式。

3. **SSG 限制**: Next.js 的静态生成模式限制了某些动态特性，主题切换可能需要配合 ISR 使用。

### 5.2 后续工作建议

1. 完成 Layout 组件的主题动态加载逻辑
2. 开发具有独特样式的新主题（如暗色主题、卡片式主题等）
3. 添加主题预览功能
4. 考虑支持主题市场或主题包的上传安装

## 6. 参考资料

- [VanBlog 官方文档](https://vanblog.mereith.com)
- [VanBlog GitHub](https://github.com/mereithhh/van-blog)
- [Next.js 主题系统设计](https://nextjs.org/docs/architecture/theming)
- [React 动态组件加载](https://react.dev/reference/react/lazy)

---

**文档版本**: 1.0.0  
**创建日期**: 2026-04-19  
**作者**: AI Assistant (Kilo)
