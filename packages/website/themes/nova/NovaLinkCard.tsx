import { LinkItem } from "../../api/getAllData";
import ImageBox from "../../components/ImageBox";

export default function NovaLinkCard(props: { link: LinkItem }) {
  return (
    <div className="nova-card nova-card-link">
      <a
        href={props.link.url}
        target="_blank"
        rel="referrer"
        className="nova-link-card-inner"
      >
        <div className="nova-link-card-logo">
          <ImageBox
            src={props.link.logo}
            alt={props.link.name}
            lazyLoad={true}
            className="nova-link-logo-img"
          />
        </div>
        <div className="nova-link-card-content">
          <p className="nova-link-card-name">{props.link.name}</p>
          <p className="nova-link-card-desc">{props.link.desc}</p>
        </div>
      </a>
    </div>
  );
}
