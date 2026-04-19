import Link from "next/link";
import dayjs from "dayjs";

interface ArticleCardProps {
  id: string;
  title: string;
  pathname: string;
  description?: string;
  date: string;
  thumb?: string;
  tags?: string[];
  category?: string;
  words?: number;
}

export default function NovaArticleCard(props: ArticleCardProps) {
  const accentColors = [
    "nova-card-accent-mint",
    "nova-card-accent-purple",
    "nova-card-accent-yellow",
    "nova-card-accent-pink",
    "nova-card-accent-orange",
    "nova-card-accent-blue",
  ];

  const randomAccent = accentColors[Math.floor(Math.random() * accentColors.length)];

  return (
    <div className="nova-card nova-animate-in">
      <div className="nova-card-kicker">
        {props.category?.toUpperCase() || "ARTICLE"}
      </div>
      <Link href={`/post/${props.pathname}`}>
        <h3 className="nova-card-headline">{props.title}</h3>
      </Link>
      {props.description && (
        <p className="nova-card-body">{props.description}</p>
      )}
      <div className="nova-card-footer nova-mt-4">
        <div className="nova-meta">
          <span>{dayjs(props.date).format("MMM D, YYYY")}</span>
          {props.words && (
            <span className="nova-ml-4">
              {Math.ceil(props.words / 300)} MIN READ
            </span>
          )}
        </div>
        <div className="nova-mt-2">
          {props.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="nova-tag nova-mr-2">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NovaArticleList(props: { children: React.ReactNode }) {
  return <div className="nova-article-list">{props.children}</div>;
}

export function NovaArticleItem(props: {
  id: string;
  title: string;
  pathname: string;
  description?: string;
  date: string;
  thumb?: string;
  category?: string;
}) {
  return (
    <div className="nova-article-item">
      {props.thumb && (
        <img
          src={props.thumb}
          alt={props.title}
          className="nova-article-thumb"
          loading="lazy"
        />
      )}
      <div className="nova-article-content">
        <Link href={`/post/${props.pathname}`}>
          <h3 className="nova-article-title">{props.title}</h3>
        </Link>
        {props.description && (
          <p className="nova-article-excerpt">{props.description}</p>
        )}
        <div className="nova-article-meta">
          <span>{dayjs(props.date).format("MMM D, YYYY")}</span>
          {props.category && <span>{props.category.toUpperCase()}</span>}
        </div>
      </div>
    </div>
  );
}
