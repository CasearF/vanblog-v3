import dynamic from "next/dynamic";
import StaticMarkdown from "./StaticMarkdown";

// bytemd 客户端渲染兜底路径懒加载：bytemd 全家桶（核心 + highlight + katex 渲染端）
// 被隔离到独立 chunk，只有真正需要客户端渲染时（加密文章解锁后 / 含 mermaid）才下载。
const ClientMarkdown = dynamic(() => import("./ClientMarkdown"));

/**
 * 文章正文渲染派发器。
 *
 * - 传入 `html`（服务端 renderStaticHtml 预渲染好的 HTML）→ 走 StaticMarkdown 静态注入，
 *   客户端零 bytemd、零二次 processSync 水合（纯阅读页的主路径）。
 * - 否则（无预渲染 HTML：加密文章解锁后的内容、含 mermaid 的文章）→ 懒加载 ClientMarkdown
 *   用 bytemd <Viewer> 客户端渲染，行为与改造前完全一致。
 */
export default function Markdown({
  content,
  html,
}: {
  content?: string;
  // string | null：来源是 getStaticProps props（Next 禁止 undefined）。null/空 走兜底渲染。
  html?: string | null;
}) {
  if (html) {
    return <StaticMarkdown html={html} />;
  }
  return <ClientMarkdown content={content || ""} />;
}
