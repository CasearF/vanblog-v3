import { describe, it, expect } from "vitest";
import { buildShareLink, shareTargets } from "../utils/shareLinks";

const url = "https://example.com/post/11";
const title = "标题 & 测试";

describe("buildShareLink", () => {
  it("encodes url and title into the weibo share intent", () => {
    expect(buildShareLink("weibo", url, title)).toBe(
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(
        url
      )}&title=${encodeURIComponent(title)}`
    );
  });

  it("uses the qzone onekey endpoint", () => {
    expect(buildShareLink("qzone", url, title)).toContain(
      "sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey"
    );
  });

  it("uses text= (not title=) for x and telegram", () => {
    expect(buildShareLink("x", url, title)).toBe(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`
    );
    expect(buildShareLink("telegram", url, title)).toBe(
      `https://t.me/share/url?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`
    );
  });

  it("escapes ampersands and spaces so params don't break", () => {
    const link = buildShareLink("weibo", "https://a.b/x?q=1&r=2", "a b&c");
    // 原始 & / 空格必须被编码，避免污染分享平台的 query
    expect(link).not.toContain("q=1&r=2");
    expect(link).toContain("a%20b%26c");
  });

  it("has a label for every share target", () => {
    expect(shareTargets.map((t) => t.key)).toEqual([
      "weibo",
      "qzone",
      "x",
      "telegram",
    ]);
    expect(shareTargets.every((t) => t.label.length > 0)).toBe(true);
  });
});
