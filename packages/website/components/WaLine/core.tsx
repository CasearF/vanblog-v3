import { useEffect } from "react";
export default function WalineComponent(props: {
  enable: "true" | "false";
  visible: boolean;
}) {
  useEffect(() => {
    const enable = props.enable === "true";
    if (!enable) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/@waline/client@3.0.0/dist/waline.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `import { init } from 'https://unpkg.com/@waline/client@3.0.0/dist/waline.js'; window.__walineInit__ = init;`;
    document.head.appendChild(script);
    const fallback = document.createElement("script");
    fallback.textContent = `window.__walineInit__ = window.Waline;`;
    document.head.appendChild(fallback);
    const initWaline = () => {
      if (window.__walineInit__ && document.getElementById("waline")) {
        window.__walineInit__({
          el: "#waline",
          serverURL: window.location.protocol + "//" + window.location.host,
          dark: ".dark",
        });
        const applyStyle = () => {
          const textarea = document.getElementById("wl-edit");
          if (textarea) {
            const body = document.body;
            if (body.classList.contains("nova-theme") || body.classList.contains("nova-nebula-theme")) {
              textarea.style.cssText = "background-color: transparent !important;";
            }
          }
        };
        applyStyle();
        setTimeout(applyStyle, 200);
        setTimeout(applyStyle, 500);
        setTimeout(applyStyle, 1000);
      }
    };
    setTimeout(initWaline, 500);
  }, [props.enable]);
  if (!props.enable || props.enable == "false") {
    return null;
  }
  return (
    <div
      id="waline"
      className="mt-2"
      style={{
        display: props.visible ? "block" : "none",
      }}
    ></div>
  );
}
