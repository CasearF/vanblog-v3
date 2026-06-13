import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight-ssr';
import math from '@bytemd/plugin-math-ssr';
import { customContainer } from './customContainer';
import rawHTML from "./rawHTML";
import { customCodeBlock } from "./codeBlock";
import { LinkTarget } from "./linkTarget";
import { Heading } from "./heading";
import { Img } from "./img";
// 注意：katex 样式已移到 pages/_app.tsx 全局引入。
// 去客户端水合后，文章正文走 StaticMarkdown（不 import 本文件），
// 公式样式必须由全局 CSS 保证，否则数学文章样式回归。
import type { BytemdPlugin } from "bytemd";

// 共享的 bytemd 插件集合。mermaid 不在此处静态引入：
// @bytemd/plugin-mermaid 会连带打入 mermaid(~600KB+ 带 d3/dagre)，
// 而全站绝大多数文章不含流程图。仅当文章含 ```mermaid 时，
// 由动态加载的 MermaidViewer 把 mermaid 插件传进来，避免它进入主 chunk。
// 保持与原实现完全一致的插件顺序（mermaid 原本位于 math 之后）。
export function buildPlugins(mermaidPlugin?: BytemdPlugin): BytemdPlugin[] {
  return [
    rawHTML(),
    gfm(),
    highlight(),
    math(),
    ...(mermaidPlugin ? [mermaidPlugin] : []),
    customContainer(),
    customCodeBlock(),
    LinkTarget(),
    Heading(),
    Img(),
  ];
}

export const sanitize = (schema: any) => {
  schema.protocols.src.push('data')
  schema.tagNames.push("center")
  schema.tagNames.push("iframe");
  schema.tagNames.push("script");
  schema.attributes["*"].push("style");
  schema.attributes["*"].push("src");
  schema.attributes["*"].push("scrolling");
  schema.attributes["*"].push("border");
  schema.attributes["*"].push("frameborder");
  schema.attributes["*"].push("framespacing");
  schema.attributes["*"].push("allowfullscreen");
  schema.strip = [];
  return schema;
};
