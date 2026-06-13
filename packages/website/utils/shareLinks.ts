export type SharePlatform = "weibo" | "qzone" | "x" | "telegram";

export interface ShareTarget {
  key: SharePlatform;
  label: string;
}

// 外链分享目标（复制链接 / 系统分享在组件里单独处理，不在此列）。
export const shareTargets: readonly ShareTarget[] = [
  { key: "weibo", label: "微博" },
  { key: "qzone", label: "QQ空间" },
  { key: "x", label: "X" },
  { key: "telegram", label: "Telegram" },
];

/**
 * 生成各平台「快捷分享」目标地址。
 * 传入原始 url / title（无需预编码），函数内部统一做 encodeURIComponent。
 */
export function buildShareLink(
  platform: SharePlatform,
  url: string,
  title: string
): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  switch (platform) {
    case "weibo":
      return `https://service.weibo.com/share/share.php?url=${u}&title=${t}`;
    case "qzone":
      return `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${u}&title=${t}`;
    case "x":
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
    default: {
      // 穷尽性检查：strict 模式下新增平台漏写 case 会在此编译报错。
      // 本包 strict:false 守不住编译，故运行时也抛错，避免把非法 platform 当成 URL 返回。
      const _exhaustive: never = platform;
      throw new Error(`Unhandled SharePlatform: ${String(_exhaustive)}`);
    }
  }
}
