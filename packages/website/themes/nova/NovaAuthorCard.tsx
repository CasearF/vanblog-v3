interface AuthorCardProps {
  logo: string;
  author: string;
  desc: string;
}

export default function NovaAuthorCard(props: AuthorCardProps) {
  return (
    <div className="nova-author-card">
      <img
        src={props.logo}
        alt={props.author}
        className="nova-author-avatar"
      />
      <h3 className="nova-author-name">{props.author}</h3>
      <p className="nova-author-desc">{props.desc}</p>
    </div>
  );
}
