import { Viewer } from "@bytemd/react";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { buildPlugins, sanitize } from "./plugins";

// 含流程图的文章才动态加载 MermaidViewer（连带 mermaid 库）；
// 其余文章走下面的轻量渲染路径，mermaid 不进主 chunk。
const MermaidViewer = dynamic(() => import("./MermaidViewer"));

// 匹配 ``` 或 ~~~ 围栏的 mermaid 代码块
const MERMAID_RE = /(^|\n)[ \t]*(?:```+|~~~+)[ \t]*mermaid\b/i;

export default function Markdown({ content }: { content: string }) {
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
