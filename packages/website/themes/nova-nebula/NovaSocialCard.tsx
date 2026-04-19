import { useEffect, useState } from "react";
import { SocialItem } from "../../api/getAllData";
import SocialIcon from "../../components/SocialIcon";

export default function NovaSocialCard(props: { socials: SocialItem[] }) {
  const [data, setData] = useState<SocialItem[][]>([]);

  useEffect(() => {
    if (!props.socials || !props.socials.length) {
      return;
    }
    const arr = props.socials.filter((each) => each.type != "wechat-dark");
    const darkWechat = props.socials.find((each) => each.type == "wechat-dark");
    const cols = Math.ceil(arr.length / 2);
    const r = [];
    for (let i = 0; i < cols; i++) {
      const t = [];
      for (let j = 0; j < 2; j++) {
        let temp = arr.shift();
        if (temp) {
          if (temp.type == "wechat" && darkWechat) {
            temp = { ...temp, dark: darkWechat.value };
          }
          t.push(temp);
        }
      }
      r.push(t);
    }
    setData(r);
  }, [props, setData]);

  const renderEach = (item: SocialItem) => {
    if (!item) {
      return <div></div>;
    }
    return (
      <div className="nova-social-item">
        <SocialIcon item={item} />
      </div>
    );
  };

  return (
    <div className="nova-social-card">
      {data.map((eachRow: SocialItem[], index) => (
        <div className="nova-social-row" key={`socalRow-${index}`}>
          {renderEach(eachRow[0])}
          {renderEach(eachRow[1])}
        </div>
      ))}
    </div>
  );
}
