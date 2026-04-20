# Waline 评论系统调试记录

> 本文档记录 VanBlog 评论系统（Waline）在开发环境中的调试过程和当前状态。

---

## 1. 问题概述

**用户反馈**：默认主题下看不到评论区

**目标**：修复 VanBlog 评论系统，使其在开发环境中正常工作。

---

## 2. 环境信息

| 服务                  | 端口 | 状态      |
| --------------------- | ---- | --------- |
| Server (VanBlog 后端) | 3000 | ✅ 运行中 |
| Waline (评论服务)     | 8360 | ✅ 运行中 |
| Website (前端)        | 3001 | ✅ 运行中 |

---

## 3. 已完成的修复

### 3.1 评论管理页面地址修复

**问题**：评论管理页面硬编码为 `http://192.168.5.11:8360/ui`

**文件**：`packages/admin/src/pages/CommentManage/index.jsx`

**修改**：将硬编码地址改为 `127.0.0.1:8360`

```javascript
const src = useMemo(() => {
  if (initialState?.version && initialState?.version == 'dev') {
    return 'http://127.0.0.1:8360/ui';
  } else {
    return '/ui/';
  }
}, [initialState]);
```

---

### 3.2 Waline PORT 配置

**问题**：Waline 默认不在 8360 端口启动，但 Caddy 配置期望它在 8360

**文件**：`packages/server/src/provider/waline/waline.provider.ts`

**修改**：在 `loadEnv()` 方法中添加 `PORT: '8360'`

```typescript
this.env = {
  ...mongoEnv,
  ...otherEnv,
  ...walineConfigEnv,
  PORT: '8360',
};
```

---

### 3.3 WalineProvider.stop() 错误修复

**问题**：原代码使用 `process.kill(-this.ctx.pid)` 会导致 `kill ESRCH` 错误

**文件**：`packages/server/src/provider/waline/waline.provider.ts`

**修改**：添加 try-catch 处理

```typescript
async stop() {
  if (this.ctx) {
    try {
      this.ctx.unref();
      process.kill(-this.ctx.pid, 'SIGTERM');
    } catch (e) {
      // Process may have already exited
    }
    this.ctx = null;
    this.logger.log('waline 停止成功！');
  }
}
```

---

### 3.4 Nova/Nova Nebula 主题添加评论组件

**问题**：Nova 和 Nova Nebula 主题的 PostCard 组件缺少 Waline 评论组件

**文件**：

- `packages/website/themes/nova/NovaPostCard.tsx`
- `packages/website/themes/nova-nebula/NovaPostCard.tsx`

**修改**：添加 Waline 组件导入和渲染

```tsx
import WaLine from '../../components/WaLine';

// 在 PostBottom 之后添加
{
  props.type !== 'overview' && <WaLine enable={props.enableComment} visible={true} />;
}
```

---

### 3.5 next.config.js 代理配置修复

**问题**：原配置使用 `...rewites` 展开方式不对，代理未生效

**文件**：`packages/website/next.config.js`

**修改**：修正代理配置

```javascript
const rewites =
  process.env.NODE_ENV == 'development'
    ? {
        async rewrites() {
          return [
            {
              source: '/api/comment',
              destination: 'http://127.0.0.1:8360/api/comment',
            },
            {
              source: '/api/comment/:path*',
              destination: 'http://127.0.0.1:8360/api/comment/:path*',
            },
            {
              source: '/comment',
              destination: 'http://127.0.0.1:8360/comment',
            },
            {
              source: '/comment/:path*',
              destination: 'http://127.0.0.1:8360/comment/:path*',
            },
            {
              source: '/api/:path*',
              destination: 'http://127.0.0.1:3000/api/:path*',
            },
          ];
        },
      }
    : {};

module.exports = withBundleAnalyzer({
  // ... other config
  ...(isDev ? rewites : {}),
});
```

---

## 4. 当前状态

### 4.1 验证结果

| 测试项       | 结果        | 说明                                                 |
| ------------ | ----------- | ---------------------------------------------------- |
| Waline 服务  | ✅ 正常     | http://localhost:8360/comment 返回 JSON              |
| 代理工作     | ✅ 正常     | http://localhost:3001/comment?path=/post/59 返回 200 |
| 评论开启     | ✅ 已开启   | enableComment=true                                   |
| Network 请求 | ⚠️ 部分成功 | 返回 200，但第一个请求被 Cancelled                   |
| 评论框显示   | ❌ 未显示   | Waline 客户端报 `Failed to fetch`                    |

### 4.2 已修复问题

- ✅ **core.tsx useEffect 重复初始化问题** - 2026-04-20 11:08

### 4.3 当前问题

**问题描述**：

- Waline 客户端初始化时报 `Failed to fetch` 错误
- `serverURL` 设置为 `http://localhost:3001`
- 手动访问 `/comment?path=/post/59` 返回正常数据
- 但 Waline 客户端内部请求失败

**错误日志**：

```
core.tsx:13 Uncaught (in promise) TypeError: Failed to fetch
    at Ce (shim.mjs:15:8053)
    ...
    at <WalineComment path="/post/59" serverURL="http://localhost:3001" dark=".dark" ...>
```

**已观察到的 Network 请求**：

```
comment?path=%2Fpost%2F59&pageSize=10&page=1&lang=zh&sortBy=insertedAt_desc  /comment  200  (已取消)
comment?type=count&url=%2Fpost%2F59&lang=zh-CN  /comment  200  http/1.1
```

**观察**：

- 两个请求都返回 200 状态码
- 但第一个请求显示为 "已取消" (Cancelled)
- 这可能导致了 Waline 客户端报 `Failed to fetch`

---

## 5. 问题根因分析

### 5.1 Next.js Strict Mode 导致重复初始化

**问题**：

- Next.js 开发模式启用 React Strict Mode
- `useEffect` 中的 effect 函数会被执行两次
- 第一个 Waline 实例的请求被第二个实例取消

**文件**：`packages/website/components/WaLine/core.tsx`

**原代码问题**：

1. `props` 对象在依赖数组中，导致依赖不稳定
2. 缺少 `destroyed` 标记，清理后可能重新初始化
3. 字符串比较 `props.enable == "true"` 不够健壮

**修复方案**：

1. 移除 `props` 依赖，使用空数组 `[]`
2. 添加 `destroyed` 标记防止销毁后重新创建
3. 使用布尔值比较 `props.enable === "true"`

**修复后代码**：

```typescript
const { current } = useRef<any>({ hasInit: false, wa: null, destroyed: false });
useEffect(() => {
  if (current.destroyed) {
    return;
  }
  const enable = props.enable === "true";
  const visible = props.visible === true;
  if (!current.hasInit && enable) {
    current.hasInit = true;
    if (visible) {
      current.wa = init({...});
    } else {
      current.wa = commentCount({...});
    }
  }
  return () => {
    if (current.wa && enable) {
      if (visible) {
        current.wa.destroy();
        current.destroyed = true;
      } else if (typeof current.wa === "function") {
        current.wa();
        current.destroyed = true;
      }
    }
  };
}, []);  // 空依赖数组，避免重复初始化
```

---

### 5.2 Waline Emoji 资源加载失败

**问题**：

- Waline 初始化时尝试从 `https://unpkg.com/@waline/emojis@1.1.0/weibo/info.json` 加载 emoji 资源
- 开发环境网络无法访问 unpkg.com，导致 `ERR_CONNECTION_CLOSED`
- 这导致 Waline 初始化失败，报 `Failed to fetch`

**错误日志**：

```
GET https://unpkg.com/@waline/emojis@1.1.0/weibo/info.json net::ERR_CONNECTION_CLOSED
core.tsx:18 Uncaught (in promise) TypeError: Failed to fetch
    at Ce (shim.mjs:15:8053)
```

**解决方案**：

在 Waline 配置中禁用 emoji 功能：

```typescript
current.wa = init({
  el: '#waline',
  serverURL: `${window.location.protocol}//${window.location.host}`,
  comment: true,
  pageview: false,
  dark: '.dark',
  lang: 'zh',
  emoji: false, // 禁用 emoji，避免网络请求
});
```

**状态**：✅ 已修复 - 2026-04-20 11:30

---

## 6. 后续调试建议

### 6.1 可能的原因

1. **CORS 问题**：代理可能没有正确处理 CORS 头
2. **请求取消**：Waline 客户端的某个内部请求被取消
3. **WebSocket 连接**：Waline 可能需要 WebSocket 连接但代理不支持
4. **unpnp.com 资源**：emoji 资源加载失败 (`ERR_CONNECTION_CLOSED`) - ✅ 已解决

### 6.2 建议的调试步骤

1. **检查 CORS 头**：
   - 在 Waline 服务端添加 CORS 中间件
   - 或配置 Next.js 代理返回正确的 CORS 头

2. **检查代理配置**：

   ```javascript
   // 在 next.config.js 中添加
   headers: [
     {
       source: '/comment/:path*',
       headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
     },
   ];
   ```

3. **尝试直接使用 Waline 地址**：
   - 修改 `serverURL` 为 `http://localhost:8360`
   - 绕过代理看是否能正常工作

4. **检查浏览器控制台**：
   - 查看完整的请求/响应详情
   - 特别关注 CORS 相关的错误

### 5.3 临时解决方案

如果暂时无法修复开发环境的问题，可以：

1. **使用生产环境测试**：生产环境的 Caddy 配置应该已经正确设置了代理和 CORS
2. **降级 Waline 客户端**：尝试使用旧版本 `@waline/client@2.14.x`
3. **手动配置 Waline**：绕过 VanBlog 内嵌的 Waline，单独部署 Waline 服务

---

## 6. 相关文件路径

### 已修改的文件

| 文件 | 修改内容 |
| --- | --- |
| `packages/admin/src/pages/CommentManage/index.jsx` | 修改 Waline 管理地址 |
| `packages/server/src/provider/waline/waline.provider.ts` | 添加 PORT 配置，修复 stop 方法 |
| `packages/website/themes/nova/NovaPostCard.tsx` | 添加 Waline 组件 |
| `packages/website/themes/nova-nebula/NovaPostCard.tsx` | 添加 Waline 组件 |
| `packages/website/next.config.js` | 修复代理配置 |
| `packages/website/components/WaLine/core.tsx` | 修复 useEffect 重复初始化问题 + 禁用 emoji |

### 关键文件

| 文件                                          | 说明              |
| --------------------------------------------- | ----------------- |
| `packages/waline/`                            | Waline 依赖目录   |
| `packages/server/`                            | 后端服务          |
| `packages/website/components/WaLine/core.tsx` | Waline 客户端组件 |
| `caddyTemplate.json`                          | Caddy 配置模板    |

---

## 7. 参考链接

- [Waline 官方文档](https://waline.js.org/)
- [Waline 客户端 API](https://waline.js.org/reference/client/api.html)
- [Waline 服务端环境变量](https://waline.js.org/reference/server/env.html)

---

**最后更新**：2026-04-20 11:35 **维护者**：Kilo AI
