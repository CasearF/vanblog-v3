import { useEffect, useState } from "react";
import { isMac } from "../../utils/ua";

export default function NovaKeyCard(props: { type: "search" | "esc" }) {
  const [keyString, setKeyString] = useState("Ctrl");

  useEffect(() => {
    if (isMac()) {
      setKeyString("⌘");
    }
  }, []);

  if (props.type == "search") {
    return (
      <div className="nova-keycard-container">
        <span className="nova-keycard nova-keycard-search">
          <span className="nova-keycard-key">{keyString}</span>
          <span className="nova-keycard-plus">+</span>
          <span className="nova-keycard-key">K</span>
        </span>
      </div>
    );
  } else {
    return (
      <div className="nova-keycard-container">
        <span className="nova-keycard nova-keycard-esc">
          <span className="nova-keycard-key">esc</span>
        </span>
      </div>
    );
  }
}
