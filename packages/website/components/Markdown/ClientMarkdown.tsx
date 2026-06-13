import { Viewer } from "@bytemd/react";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { buildPlugins, sanitize } from "./plugins";

// 客户端 bytemd 渲染兜底路径（原 components/Markdown/index.tsx 的实现，逐字搬移）。
// 仅在「无服务端预渲染 HTML」时使用：加密文章解锁后拿到的内容、含 mermaid 的文章。
// 经 index.tsx 用 next/dynamic 懒加载 → bytemd 全家桶被隔离到独立 chunk，
// 不进文章页/列表页的主 chunk（纯阅读页不再为它付水合代价）。

// 含流程图的文章才动态加载 MermaidViewer（连带 mermaid 库）；
// 其余文章走下面的轻量渲染路径，mermaid 不进主 chunk。
const MermaidViewer = dynamic(() => import("./MermaidViewer"));

// 匹配 ``` 或 ~~~ 围栏的 mermaid 代码块
const MERMAID_RE = /(^|\n)[ \t]*(?:```+|~~~+)[ \t]*mermaid\b/i;

export default function ClientMarkdown({ content }: { content: string }) {
  const hasMermaid = useMemo(() => MERMAID_RE.test(content || ""), [content]);
  const plugins = useMemo(() => buildPlugins(), []);

  if (hasMermaid) {
    return <MermaidViewer content={content} />;
  }

  return (
    <div className="markdown-body">
      <Viewer
        value={content}
        plugins={plugins}
        remarkRehype={{ allowDangerousHtml: true }}
        sanitize={sanitize}
      />
    </div>
  );
}
