// Article 的唯一定义在 @vanblog/shared，前后端共用同一份契约。
// 这里 re-export 以保持 `../types/article` 这个导入路径不变（十余处引用无需改动）。
import type { Article } from "@vanblog/shared";
export type { Article };

// website 侧在数据层（getStaticProps）给文章附加的服务端预渲染正文 HTML。
// 是纯展示字段、不属于前后端契约，故不污染 @vanblog/shared 的 Article。
// html 用 string | null（不用 undefined）：该字段会进 getStaticProps 的 props，
// Next 禁止 props 出现 undefined。无预渲染时（加密/ mermaid/空）为 null，组件按 falsy 回退客户端渲染。
export type ArticleWithHtml = Article & { html?: string | null };
