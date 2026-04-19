# Dockerfile 构建参数修复

> 此文档记录了 Dockerfile 中 `VAN_BLOG_BUILD_SERVER` 参数的修复过程。

## 1. 问题描述

### 1.1 原始问题

在测试机上使用 Docker 构建镜像时，构建失败：

```
TypeError [ERR_INVALID_URL]: Invalid URL
    at new NodeError (node:internal/errors:405:5)
    at new URL (node:internal/url:676:13)
Error: Failed to collect page data for /category
```

### 1.2 根本原因

`Dockerfile` 中 `VAN_BLOG_BUILD_SERVER` ARG 没有默认值：

```dockerfile
ARG VAN_BLOG_BUILD_SERVER
ENV VAN_BLOG_SERVER_URL ${VAN_BLOG_BUILD_SERVER}
```

当构建时未传递 `--build-arg VAN_BLOG_BUILD_SERVER=...` 参数时，`VAN_BLOG_SERVER_URL` 环境变量为空字符串。

### 1.3 错误传播链

```
构建时 VAN_BLOG_SERVER_URL=""
    ↓
Next.js 在 getStaticProps 中调用 API
    ↓
new URL("") 抛出 TypeError
    ↓
构建失败
```

## 2. 解决方案

### 2.1 修改方案

为 `VAN_BLOG_BUILD_SERVER` 设置默认值：

```dockerfile
ARG VAN_BLOG_BUILD_SERVER=http://localhost:3000
ENV VAN_BLOG_SERVER_URL ${VAN_BLOG_BUILD_SERVER}
```

### 2.2 为什么默认值能解决问题

VanBlog 前端代码在 `packages/website/api/getAllData.ts` 中有容错处理：

```typescript
try {
  const url = `${config.baseUrl}api/public/meta`;
  const res = await fetch(url);
  // ...
} catch (err) {
  if (process.env.isBuild == 't') {
    console.log('无法连接，采用默认值');
    return defaultMeta; // 返回默认数据
  }
  throw err;
}
```

当 `isBuild=t`（构建模式）且连接失败时，会捕获错误并返回默认数据，允许构建继续进行。

## 3. 作者推荐的方式

根据 `docs/contribution.md` 中的说明，作者推荐在构建时传入一个已运行的服务器地址：

```bash
# 构建时指定一个已运行的 VanBlog 服务器地址
VAN_BLOG_BUILD_SERVER="https://blog-demo.mereith.com"
docker build --build-arg VAN_BLOG_BUILD_SERVER=$VAN_BLOG_BUILD_SERVER -t vanblog:test .
```

这样做的好处是：

1. 预填充静态页面数据
2. 避免使用默认空数据
3. 构建出的镜像包含真实内容

## 4. 修改文件

**文件**: `Dockerfile` (第 43-44 行)

**修改前**:

```dockerfile
ARG VAN_BLOG_BUILD_SERVER
ENV VAN_BLOG_SERVER_URL ${VAN_BLOG_BUILD_SERVER}
```

**修改后**:

```dockerfile
ARG VAN_BLOG_BUILD_SERVER=http://localhost:3000
ENV VAN_BLOG_SERVER_URL ${VAN_BLOG_BUILD_SERVER}
```

## 5. 构建命令

### 5.1 方式一：不指定（使用默认值）

```bash
docker build -t vanblog:test .
```

适合场景：

- 快速测试构建
- 后续通过 ISR 增量渲染

### 5.2 方式二：指定服务器地址

```bash
docker build \
  --build-arg VAN_BLOG_BUILD_SERVER=https://blog-demo.mereith.com \
  -t vanblog:test .
```

适合场景：

- 生产部署
- 需要预填充数据

### 5.3 方式三：指定其他 VanBlog 实例

```bash
docker build \
  --build-arg VAN_BLOG_BUILD_SERVER=http://你的服务器IP:3000 \
  -t vanblog:test .
```

## 6. 验证构建

### 6.1 查看环境变量

在构建过程中可以看到：

```
ENV VAN_BLOG_SERVER_URL http://localhost:3000
```

### 6.2 构建成功标志

```
✓ Compiled successfully
✓ Generating static pages (8/8)
```

## 7. 相关文件

| 文件                                   | 说明                      |
| -------------------------------------- | ------------------------- |
| `Dockerfile`                           | 主构建文件                |
| `packages/website/api/getAllData.ts`   | 前端 API 调用，含容错逻辑 |
| `packages/website/utils/loadConfig.ts` | 配置加载器                |
| `docs/contribution.md`                 | 作者的开发指南            |

---

**文档版本**: 1.0.0  
**创建日期**: 2026-04-19  
**相关 Issue**: 构建失败 `ERR_INVALID_URL`
