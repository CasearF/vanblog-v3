import { useEffect, useRef } from "react";
import { attachMarkdownBehaviors } from "./staticBehaviors";

// 服务端预渲染好的正文 HTML，客户端直接静态注入，不再经 bytemd <Viewer> 二次 processSync 水合。
// DOM 结构与原 components/Markdown/index.tsx + @bytemd/react <Viewer> 逐字节对齐：
//   外层 <div class="markdown-body">（原 index.tsx 包裹）
//     内层 <div class="markdown-body" onClick=锚点滚动 dangerouslySetInnerHTML>（原 Viewer）
export default function StaticMarkdown({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return attachMarkdownBehaviors(ref.current);
  }, [html]);

  // 正文内 `#xxx` 锚点平滑滚动，对齐 @bytemd/react <Viewer> 容器自带的 onClick。
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const $ = e.target as HTMLElement;
    if ($.tagName !== "A") return;
    const href = $.getAttribute("href");
    if (!href?.startsWith("#")) return;
    ref.current
      ?.querySelector("#user-content-" + href.slice(1))
      ?.scrollIntoView();
  };

  // 安全姿态：html 由服务端 renderStaticHtml 经与原 <Viewer> 完全相同的 sanitize 管线产出，
  // 注入方式（dangerouslySetInnerHTML）也与 @bytemd/react <Viewer> 逐字一致 —— 本组件未新增
  // 任何 XSS 面。sanitize 白名单含 <script> 是站长自用能力（单作者博客，内容可信），且经
  // innerHTML 注入的 <script> 本就不会执行，新旧路径行为相同。
  return (
    <div className="markdown-body">
      <div
        ref={ref}
        className="markdown-body"
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
