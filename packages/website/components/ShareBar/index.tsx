import { useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import {
  buildShareLink,
  shareTargets,
  SharePlatform,
} from "../../utils/shareLinks";

// Feather「link」「share-2」图标，纯内联 SVG（零依赖，颜色随 currentColor）。
function LinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// 注意：tailwind content 只扫描 components/ 与 pages/，
// 因此这些类名（含任意值 hover 颜色）必须写在本文件里才会被生成。
// dark 描边用 gray-600（#4b5563）而非 nav-dark（#26282c）——后者与文章卡片 dark:bg-dark
// 同色会让药丸边框在暗色模式下完全消失。
const pill =
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm leading-none transition-colors cursor-pointer select-none text-gray-500 border-gray-200 dark:text-dark dark:border-gray-600";
const neutralHover =
  "hover:text-gray-900 hover:border-gray-400 dark-border-hover";
const brandHover: Record<SharePlatform, string> = {
  weibo: "hover:text-[#e6162d] hover:border-[#e6162d]",
  qzone: "hover:text-[#d97706] hover:border-[#d97706]",
  x: "hover:text-black hover:border-black dark:hover:text-white dark:hover:border-white",
  telegram: "hover:text-[#2aabee] hover:border-[#2aabee]",
};

export default function ShareBar(props: { title: string }) {
  // navigator.share 仅移动端/部分浏览器可用 → 挂载后再特性探测，避免 SSR 水合不一致。
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      setCanNativeShare(true);
    }
  }, []);

  const currentUrl = () =>
    typeof location !== "undefined" ? location.href : "";

  const handleCopy = () => {
    copy(decodeURIComponent(currentUrl()));
    toast.success("已复制本文链接！", { className: "toast" });
  };

  const handleNativeShare = () => {
    navigator.share({ title: props.title, url: currentUrl() }).catch(() => {
      // 用户取消或浏览器不支持，静默忽略。
    });
  };

  const openPlatform = (platform: SharePlatform) => {
    window.open(
      buildShareLink(platform, currentUrl(), props.title),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-gray-500 select-none dark:text-dark">
        分享：
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="复制本文链接"
        className={`${pill} ${neutralHover}`}
      >
        <LinkIcon />
        复制链接
      </button>
      {shareTargets.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => openPlatform(t.key)}
          aria-label={`分享到 ${t.label}`}
          className={`${pill} ${brandHover[t.key]}`}
        >
          {t.label}
        </button>
      ))}
      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label="使用系统分享"
          className={`${pill} ${neutralHover}`}
        >
          <ShareIcon />
          分享
        </button>
      )}
    </div>
  );
}
