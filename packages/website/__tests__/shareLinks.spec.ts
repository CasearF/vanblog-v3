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

  it("uses the qzone onekey endpoint and encodes both params", () => {
    const link = buildShareLink("qzone", url, title);
    expect(link).toContain(
      "sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey"
    );
    expect(link).toContain(`url=${encodeURIComponent(url)}`);
    expect(link).toContain(`title=${encodeURIComponent(title)}`);
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

  it("double-encodes pre-encoded input (callers must pass the raw url, not pre-encoded)", () => {
    // 契约：传入原始 url。若误传已编码的 %20，会被再编码成 %2520——固化此行为以警示调用方。
    expect(
      buildShareLink("weibo", "https://a.b/?q=hello%20world", "t")
    ).toContain("hello%2520world");
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
