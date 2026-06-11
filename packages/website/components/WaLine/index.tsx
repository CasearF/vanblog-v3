import dynamic from "next/dynamic";

// dynamic() 必须在模块顶层调用；放在组件 render 内会每次渲染生成新组件类型，
// 导致强制卸载重挂、重复触发 core 的副作用。
const Core = dynamic(() => import("./core"));

export default function WaLine(props: {
  enable: "true" | "false";
  visible: boolean;
}) {
  if (!props.enable || props.enable == "false") {
    return null;
  }
  return <Core enable={props.enable} visible={props.visible} />;
}
