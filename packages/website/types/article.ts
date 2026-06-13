// Article 的唯一定义在 @vanblog/shared，前后端共用同一份契约。
// 这里 re-export 以保持 `../types/article` 这个导入路径不变（十余处引用无需改动）。
import type { Article } from "@vanblog/shared";
export type { Article };

// website 侧在数据层（getStaticProps）给文章附加的服务端预渲染正文 HTML。
// 是纯展示字段、不属于前后端契约，故不污染 @vanblog/shared 的 Article。
export type ArticleWithHtml = Article & { html?: string };
