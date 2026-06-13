import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import mediumZoom from "medium-zoom";

// 去 bytemd 客户端水合后，正文 HTML 由服务端静态产出。
// 原先挂在各插件 viewerEffect 上的「真正依赖 JS」的交互，在这里用原生事件补回，
// 行为与原 codeBlock/heading/img 插件逐项对齐。本文件不 import 任何 bytemd，
// 以保证静态渲染路径（StaticMarkdown）不会把 bytemd 拉回客户端包。

// 代码块复制按钮（对齐 components/Markdown/codeBlock.tsx 的 onClickCopyCode）
const onClickCopyCode = (e: Event) => {
  const copyBtn = e.currentTarget as HTMLElement;
  const code = copyBtn.parentElement?.parentElement?.querySelector("code")
    ?.textContent;
  copy(code || "");
  toast.success("复制成功", { className: "toast" });
};

// 标题点击改 hash（对齐 components/Markdown/heading.tsx 的 onClickHeading）
// 刻意用 e.currentTarget（.markdown-heading 元素本身）而非原插件的 e.target：
// 监听器直接挂在标题上，点纯文本标题时两者相同；但点标题内联子元素（<code>/<strong>）时
// e.target 是子元素、取不到 data-id（原实现会得到 null），currentTarget 始终是标题、更正确。
const onClickHeading = (e: Event) => {
  const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
  if (id) {
    window.location.hash = `#${id}`;
  }
};

/**
 * 把正文里依赖 JS 的交互挂到静态 DOM 上，返回 cleanup（卸载/内容切换时调用）。
 * 覆盖：代码块复制、标题锚点、图片 medium-zoom 缩放。
 * （正文锚点平滑滚动在 StaticMarkdown 的容器 onClick 上处理，对齐 bytemd <Viewer>。）
 */
export function attachMarkdownBehaviors(root: HTMLElement): () => void {
  const copyBtns = Array.from(
    root.querySelectorAll<HTMLElement>(".code-block-wrapper .code-copy-btn")
  );
  copyBtns.forEach((btn) => {
    btn.removeEventListener("click", onClickCopyCode);
    btn.addEventListener("click", onClickCopyCode);
  });

  const headings = Array.from(
    root.querySelectorAll<HTMLElement>(".markdown-heading")
  );
  headings.forEach((h) => {
    h.removeEventListener("click", onClickHeading);
    h.addEventListener("click", onClickHeading);
  });

  // 图片缩放：只对尚未初始化的图片挂载（对齐 img.tsx 的 data-zoomed 守卫）。
  const newImgs = root.querySelectorAll<HTMLImageElement>(
    ".img-zoom:not([data-zoomed])"
  );
  const zoom = mediumZoom(newImgs);
  newImgs.forEach((img) => img.setAttribute("data-zoomed", "true"));

  return () => {
    copyBtns.forEach((btn) => btn.removeEventListener("click", onClickCopyCode));
    headings.forEach((h) => h.removeEventListener("click", onClickHeading));
    zoom.detach();
  };
}
