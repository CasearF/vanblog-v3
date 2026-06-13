// Waline 文章反应（reaction）的自托管表情。
// 用内联 data-URI SVG：零第三方 CDN、零额外 HTTP 请求，契合「快到极致」北极星。
// 数组顺序须与下方 reactionLocale 的 reaction0..5 一一对应。

const FACE_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">' +
  '<circle cx="18" cy="18" r="15.5" fill="#FFD93B" stroke="#E6A800" stroke-width="1.2"/>';
const FACE_CLOSE = "</svg>";

// encodeURIComponent 兜底处理 # < > 引号等，保证 data URI 合法（SSR/浏览器均可执行）。
const toDataUri = (inner: string): string =>
  `data:image/svg+xml,${encodeURIComponent(FACE_OPEN + inner + FACE_CLOSE)}`;

const faces: string[] = [
  // 0 赞同：点眼 + 微笑
  '<circle cx="13" cy="15" r="1.7" fill="#5A3B00"/><circle cx="23" cy="15" r="1.7" fill="#5A3B00"/><path d="M12 21.5Q18 26.5 24 21.5" fill="none" stroke="#5A3B00" stroke-width="1.8" stroke-linecap="round"/>',
  // 1 喜欢：弯弯笑眼 + 微笑
  '<path d="M10.5 16Q13 13 15.5 16" fill="none" stroke="#5A3B00" stroke-width="1.6" stroke-linecap="round"/><path d="M20.5 16Q23 13 25.5 16" fill="none" stroke="#5A3B00" stroke-width="1.6" stroke-linecap="round"/><path d="M12 21.5Q18 26.5 24 21.5" fill="none" stroke="#5A3B00" stroke-width="1.8" stroke-linecap="round"/>',
  // 2 开心：张嘴大笑
  '<circle cx="13" cy="15" r="1.7" fill="#5A3B00"/><circle cx="23" cy="15" r="1.7" fill="#5A3B00"/><path d="M11.5 21Q18 30 24.5 21Z" fill="#5A3B00"/>',
  // 3 惊讶：圆睁眼 + O 形嘴
  '<circle cx="13" cy="15" r="2.4" fill="#fff" stroke="#5A3B00" stroke-width="1.1"/><circle cx="13" cy="15" r="1" fill="#5A3B00"/><circle cx="23" cy="15" r="2.4" fill="#fff" stroke="#5A3B00" stroke-width="1.1"/><circle cx="23" cy="15" r="1" fill="#5A3B00"/><ellipse cx="18" cy="24" rx="2.6" ry="3.2" fill="#5A3B00"/>',
  // 4 思考：单边挑眉 + 斜抿嘴
  '<circle cx="13" cy="15.5" r="1.7" fill="#5A3B00"/><circle cx="23" cy="15.5" r="1.7" fill="#5A3B00"/><path d="M20.5 11.6Q23 10.4 25.6 11.9" fill="none" stroke="#5A3B00" stroke-width="1.4" stroke-linecap="round"/><path d="M12.5 23.6Q18 22 23.6 24.6" fill="none" stroke="#5A3B00" stroke-width="1.8" stroke-linecap="round"/>',
  // 5 反对：怒眉 + 撇嘴
  '<circle cx="13" cy="16" r="1.7" fill="#5A3B00"/><circle cx="23" cy="16" r="1.7" fill="#5A3B00"/><path d="M10.5 12L15.5 14" stroke="#5A3B00" stroke-width="1.6" stroke-linecap="round"/><path d="M25.5 12L20.5 14" stroke="#5A3B00" stroke-width="1.6" stroke-linecap="round"/><path d="M12 25.5Q18 20.5 24 25.5" fill="none" stroke="#5A3B00" stroke-width="1.8" stroke-linecap="round"/>',
];

export const reactionImages: string[] = faces.map(toDataUri);

export const reactionLocale = {
  reactionTitle: "你觉得这篇文章怎么样？",
  reaction0: "赞同",
  reaction1: "喜欢",
  reaction2: "开心",
  reaction3: "惊讶",
  reaction4: "思考",
  reaction5: "反对",
};
