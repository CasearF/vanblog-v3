import { useEffect, useRef } from "react";

// Waline 的 CSS/JS 资源在整个页面生命周期内只注入一次，
// 避免组件每次挂载/重渲染都向 <head> 追加重复节点。
let cssInjected = false;
let esmInjected = false;

export default function WalineComponent(props: {
  enable: "true" | "false";
  visible: boolean;
}) {
  const instanceRef = useRef<{ destroy?: () => void } | null>(null);

  useEffect(() => {
    if (props.enable !== "true") return;

    // 1. 注入样式（仅一次）
    if (!cssInjected) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/@waline/client@3.13.0/dist/waline.css";
      document.head.appendChild(link);
      cssInjected = true;
    }

    // 2. 注入 ESM 模块（仅一次），加载完成后挂到 window.__walineInit__
    if (!esmInjected) {
      const script = document.createElement("script");
      script.type = "module";
      script.textContent =
        "import { init } from 'https://unpkg.com/@waline/client@3.13.0/dist/waline.js'; window.__walineInit__ = init;";
      document.head.appendChild(script);
      esmInjected = true;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    // Nova 系列主题下把评论框背景设为透明，与主题风格一致
    const applyStyle = () => {
      const textarea = document.getElementById("wl-edit");
      if (!textarea) return;
      const body = document.body;
      if (
        body.classList.contains("nova-theme") ||
        body.classList.contains("nova-nebula-theme")
      ) {
        textarea.style.cssText = "background-color: transparent !important;";
      }
    };

    // 3. 轮询等待 ESM 模块就绪后再初始化（最多 10s），避免 CDN 慢时单次超时永久失败
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // 40 * 250ms = 10s
    const intervalId = setInterval(() => {
      attempts++;
      const el = document.getElementById("waline");
      if (typeof window.__walineInit__ === "function" && el) {
        clearInterval(intervalId);
        instanceRef.current = window.__walineInit__({
          el: "#waline",
          serverURL: window.location.protocol + "//" + window.location.host,
          dark: ".dark",
        });
        applyStyle();
        timers.push(setTimeout(applyStyle, 200));
        timers.push(setTimeout(applyStyle, 500));
        timers.push(setTimeout(applyStyle, 1000));
      } else if (attempts >= MAX_ATTEMPTS) {
        clearInterval(intervalId);
        // eslint-disable-next-line no-console
        console.warn("WaLine: 初始化超时，未能加载评论组件");
      }
    }, 250);

    return () => {
      clearInterval(intervalId);
      timers.forEach((t) => clearTimeout(t));
      try {
        instanceRef.current?.destroy?.();
      } catch (e) {
        // 忽略实例销毁异常
      }
      instanceRef.current = null;
    };
  }, [props.enable]);

  if (!props.enable || props.enable === "false") {
    return null;
  }
  return (
    <div
      id="waline"
      className="mt-2"
      aria-live="polite"
      style={{
        display: props.visible ? "block" : "none",
      }}
    ></div>
  );
}
