// 文章正文「展示内容」的纯函数推导，供服务端预渲染（renderStaticHtml）使用。
// 逻辑与 components/PostCard 的 calContent 对齐：
//  - 全文页（article/about）：去掉首个 <!-- more --> 标记；
//  - 列表摘要（overview）：加密文章给占位提示，否则取 <!-- more --> 之前或前 50 字。
// 客户端走 StaticMarkdown 时以服务端预渲染的 HTML 为准，本文件保证那份 HTML 取自正确的展示内容。

export const PRIVATE_OVERVIEW_PLACEHOLDER =
  "该文章已加密，点击 `阅读全文` 并输入密码后方可查看。";

/** 全文页展示内容：去掉首个 <!-- more --> 标记（与 calContent 的 article/about 分支一致）。 */
export function stripMore(content: string | undefined | null): string {
  return (content || "").replace("<!-- more -->", "");
}

/** 列表摘要展示内容（与 calContent 的 overview 分支一致）。 */
export function overviewMarkdown(article: {
  content?: string;
  private?: boolean;
}): string {
  if (article.private) {
    return PRIVATE_OVERVIEW_PLACEHOLDER;
  }
  const content = article.content || "";
  const r = content.split("<!-- more -->");
  if (r.length > 1) {
    return r[0];
  }
  return content.substring(0, 50);
}
