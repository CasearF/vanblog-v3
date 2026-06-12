import { Viewer } from "@bytemd/react";
import mermaid from "@bytemd/plugin-mermaid";
import { useMemo } from "react";
import { buildPlugins, sanitize } from "./plugins";

// 仅对含 ```mermaid 的文章渲染。通过 next/dynamic 懒加载本组件，
// 把 @bytemd/plugin-mermaid + mermaid 库隔离到独立 chunk，
// 不含流程图的文章（站内绝大多数）不会下载这部分体积。
export default function MermaidViewer({ content }: { content: string }) {
  const plugins = useMemo(() => buildPlugins(mermaid()), []);
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
