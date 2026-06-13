import { getProcessor } from "bytemd";
import { buildPlugins, sanitize } from "../components/Markdown/plugins";

// 与 components/Markdown/index.tsx 中的 MERMAID_RE 保持一致：
// 含 mermaid 围栏的文章无法在服务端静态出图（图形需客户端 JS 渲染），
// 这类文章返回 undefined，由调用方回退到客户端 <Viewer>（MermaidViewer）路径。
const MERMAID_RE = /(^|\n)[ \t]*(?:```+|~~~+)[ \t]*mermaid\b/i;

/**
 * 服务端把 markdown 渲染成 HTML 字符串（仅在 getStaticProps/数据层调用，不进客户端包）。
 *
 * 使用与 @bytemd/react <Viewer> 完全相同的处理管线
 * （getProcessor + buildPlugins() + sanitize + remarkRehype.allowDangerousHtml），
 * 因此产出的 HTML 与原客户端渲染逐字节一致 —— 客户端不再二次 processSync 水合。
 *
 * 返回 null 的情况（调用方应回退到客户端渲染）：
 *  - 内容为空；
 *  - 含 mermaid 代码块（需客户端出图）；
 *  - 处理抛错（保底，绝不让单篇渲染失败拖垮整页构建）。
 *
 * ⚠️ 必须返回 null 而非 undefined：本函数结果直接进 getStaticProps 的 props，
 * Next.js 禁止 props 里出现 undefined（`undefined cannot be serialized as JSON`），
 * 只接受 null 或省略该字段。
 */
export function renderStaticHtml(content: string | undefined | null): string | null {
  if (!content) return null;
  if (MERMAID_RE.test(content)) return null;
  try {
    const file = getProcessor({
      sanitize,
      plugins: buildPlugins(),
      remarkRehype: { allowDangerousHtml: true },
    }).processSync(content);
    return file.toString();
  } catch (err) {
    console.error("[renderStaticHtml] 渲染失败，回退客户端渲染：", err);
    return null;
  }
}
