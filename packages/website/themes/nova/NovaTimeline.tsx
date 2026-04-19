import Link from "next/link";
import dayjs from "dayjs";

interface TimelineItemProps {
  id: string;
  title: string;
  pathname: string;
  description?: string;
  date: string;
  thumb?: string;
  tags?: string[];
  category?: string;
}

export function NovaTimeline(props: { children: React.ReactNode }) {
  return <div className="nova-timeline">{props.children}</div>;
}

export function NovaTimelineItem(props: TimelineItemProps) {
  const timestamp = dayjs(props.date).format("HH:mm");

  return (
    <div className="nova-timeline-item">
      <span className="nova-timeline-timestamp">{timestamp}</span>
      {props.thumb && (
        <div className="nova-image-frame nova-mb-4">
          <img
            src={props.thumb}
            alt={props.title}
            loading="lazy"
          />
        </div>
      )}
      <div className="nova-card-kicker">
        {props.category?.toUpperCase() || "POST"}
      </div>
      <Link href={`/post/${props.pathname}`}>
        <h3 className="nova-card-headline">{props.title}</h3>
      </Link>
      {props.description && (
        <p className="nova-card-body nova-mt-2">{props.description}</p>
      )}
      <div className="nova-mt-4">
        {props.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="nova-tag nova-mr-2">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
