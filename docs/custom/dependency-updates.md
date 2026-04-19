# 依赖更新文档

> 此文档记录了 VanBlog 依赖更新的过程、策略和变更内容。

## 1. 更新背景

VanBlog 原作者已停更多年，依赖存在大量过时版本，包括：

- 安全漏洞风险
- 性能问题
- 兼容性风险

## 2. 更新策略

### 2.1 保守策略

采用**保守更新策略**，避免破坏性变更：

- **不升级 major 版本**: 如 Umi 3→4, Next.js 13→14, React 17→18, NestJS 9→10, Ant Design 4→5
- **只更新 minor/patch 版本**: 保持在已知稳定的主流版本
- **优先更新开发依赖**: 如 ESLint, Prettier 等
- **跳过可能有问题的依赖**: 如 Waline 2.16.0

### 2.2 版本选择原则

1. **选择最新稳定版**: 避免 alpha/beta/rc 版本
2. **参考官方文档**: 查看作者推荐的版本范围
3. **测试验证**: 更新后执行 `pnpm build` 验证

## 3. 变更清单

### 3.1 根目录 (package.json)

| 依赖                               | 原版本  | 新版本  | 说明                         |
| ---------------------------------- | ------- | ------- | ---------------------------- |
| `@typescript-eslint/eslint-plugin` | ^6.13.1 | ^6.21.0 | TypeScript ESLint 插件       |
| `@typescript-eslint/parser`        | ^6.13.1 | ^6.21.0 | TypeScript ESLint 解析器     |
| `eslint`                           | ^8.54.0 | ^8.56.0 | JavaScript/TypeScript linter |
| `eslint-config-prettier`           | ^9.0.0  | ^9.1.0  | Prettier ESLint 配置         |
| `eslint-plugin-prettier`           | ^5.0.1  | ^5.1.3  | Prettier ESLint 插件         |
| `prettier`                         | ^3.1.0  | ^3.2.5  | 代码格式化工具               |
| `nan`                              | ^2.18.0 | ^2.18.0 | （无变化）                   |

### 3.2 Server 包 (packages/server/package.json)

| 依赖               | 原版本   | 新版本   | 说明           |
| ------------------ | -------- | -------- | -------------- |
| `axios`            | ^1.6.2   | ^1.7.9   | HTTP 客户端    |
| `dayjs`            | ^1.11.10 | ^1.11.20 | 日期处理       |
| `highlight.js`     | ^11.9.0  | ^11.11.1 | 代码高亮       |
| `jimp`             | ^0.22.10 | ^0.22.12 | 图片处理       |
| `js-base64`        | ^3.7.5   | ^3.7.8   | Base64 编码    |
| `lodash`           | ^4.17.21 | ^4.18.1  | 工具库         |
| `mongoose`         | ^7.6.6   | ^7.6.8   | MongoDB ODM    |
| `@types/supertest` | （新增） | ^2.0.16  | Supertest 类型 |

### 3.3 Admin 包 (packages/admin/package.json)

| 依赖                 | 原版本   | 新版本   | 说明              |
| -------------------- | -------- | -------- | ----------------- |
| `@bytemd/plugin-*`   | ^1.21.0  | ^1.22.0  | ByteMD 编辑器插件 |
| `@emoji-mart/data`   | ^1.1.2   | ^1.2.1   | Emoji 选择器      |
| `antd`               | ^4.24.15 | ^4.24.16 | Ant Design 组件库 |
| `antd-img-crop`      | ^4.17.0  | ^4.21.0  | 图片裁剪组件      |
| `bytemd`             | ^1.21.0  | ^1.22.0  | Markdown 编辑器   |
| `classnames`         | ^2.3.2   | ^2.5.1   | 条件类名工具      |
| `emoji-mart`         | ^5.5.2   | ^5.6.0   | Emoji 组件        |
| `highlight.js`       | ^11.9.0  | ^11.11.1 | 代码高亮          |
| `js-sha256`          | ^0.9.0   | ^0.11.1  | SHA256 哈希       |
| `lodash`             | ^4.17.21 | ^4.18.1  | 工具库            |
| `moment`             | ^2.29.4  | ^2.30.1  | 日期处理          |
| `rc-menu`            | ^9.12.2  | ^9.12.4  | React Menu 组件   |
| `rc-resize-observer` | ^1.4.0   | ^1.4.3   | Resize 观察器     |
| `rc-util`            | ^5.38.1  | ^5.44.0  | React 工具库      |

**注意**: `monaco-editor` 未更新（^0.34.1），因为新版与 `react-monaco-editor` 不兼容

### 3.4 Website 包 (packages/website/package.json)

| 依赖                     | 原版本   | 新版本   | 说明                       |
| ------------------------ | -------- | -------- | -------------------------- |
| `@bytemd/plugin-*`       | ^1.21.0  | ^1.22.0  | ByteMD 编辑器插件          |
| `@bytemd/react`          | ^1.21.0  | ^1.22.0  | ByteMD React 绑定          |
| `@types/markdown-navbar` | ^1.4.3   | ^1.4.4   | Markdown 导航类型          |
| `@waline/client`         | ^2.15.8  | ^2.15.8  | （保持不变，避免兼容问题） |
| `bytemd`                 | ^1.21.0  | ^1.22.0  | Markdown 编辑器            |
| `dayjs`                  | ^1.11.10 | ^1.11.20 | 日期处理                   |
| `js-base64`              | ^3.7.5   | ^3.7.8   | Base64 编码                |
| `lodash`                 | ^4.17.21 | ^4.18.1  | 工具库                     |
| `react-photo-view`       | ^1.2.3   | ^1.2.7   | 图片预览组件               |
| `sharp`                  | ^0.31.3  | ^0.33.5  | 图片处理（重大更新）       |

### 3.5 CLI 包 (packages/cli/package.json)

| 依赖      | 原版本 | 新版本 | 说明         |
| --------- | ------ | ------ | ------------ |
| `mongodb` | ^5.9.1 | ^5.9.2 | MongoDB 驱动 |

## 4. 构建验证

### 4.1 Server 构建

```bash
cd packages/server && pnpm build
# 结果: ✅ 成功
```

### 4.2 Admin 构建

```bash
cd packages/admin && pnpm build
# 结果: ✅ 成功
# 警告: 存在一个已知的 Modal 导入警告（原有代码问题）
```

### 4.3 Website 构建

```bash
cd packages/website && pnpm build
# 结果: ⚠️ 编译成功，symlink 错误（Windows pnpm 限制）
# 说明: 编译本身成功，symlink 错误是 pnpm 在 Windows 上的已知问题
```

## 5. 遇到的问题和解决方案

### 5.1 React 17.0.25 不存在

**问题**: 在更新 admin 包时，设置了 `react: ^17.0.25`，但该版本不存在。

**解决**: 保持 `react: ^17.0.2` 不变。

### 5.2 Waline 2.16.0 不兼容

**问题**: `@waline/client@2.16.0` 不兼容现有代码。

**解决**: 保持 `@waline/client@^2.15.8` 不变。

### 5.3 Monaco Editor 版本冲突

**问题**: `monaco-editor@0.44.0` 与 `react-monaco-editor` 不兼容。

**解决**: 保持 `monaco-editor@^0.34.1` 不变。

### 5.4 Windows Symlink 错误

**问题**: pnpm 在 Windows 上创建 symlink 时权限报错。

**解决**: 这是 Windows 的已知限制，不影响代码正确性。在 Linux 环境构建无此问题。

## 6. 后续建议

### 6.1 定期更新

建议定期执行以下命令检查过时依赖：

```bash
pnpm outdated
```

### 6.2 安全审计

建议定期执行安全审计：

```bash
pnpm audit
```

### 6.3 浏览器列表更新

构建时会提示更新 `caniuse-lite`，可执行：

```bash
npx update-browserslist-db@latest
```

---

**文档版本**: 1.0.0  
**创建日期**: 2026-04-19  
**更新日期**: 2026-04-19
