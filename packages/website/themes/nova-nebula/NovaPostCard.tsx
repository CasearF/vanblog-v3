import Link from "next/link";
import { useMemo, useState } from "react";
import NovaAlertCard from "./NovaAlertCard";
import { PostBottom } from "../../components/PostCard/bottom";
import { SubTitle, Title } from "../../components/PostCard/title";
import { getTarget } from "../../components/Link/tools";
import Markdown from "../../components/Markdown";
import WaLine from "../../components/WaLine";

export default function NovaPostCard(props: {
  id: number | string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
  catelog: string;
  content: string;
  setContent: (content: string) => void;
  type: "overview" | "article" | "about";
  pay?: string[];
  payDark?: string[];
  author?: string;
  tags?: string[];
  next?: { id: number; title: string; pathname?: string };
  pre?: { id: number; title: string; pathname?: string };
  enableComment: "true" | "false";
  top: number;
  private: boolean;
  showDonateInAbout?: boolean;
  hideDonate?: boolean;
  hideCopyRight?: boolean;
  openArticleLinksInNewWindow: boolean;
  copyrightAggreement: string;
  customCopyRight: string | null;
  showExpirationReminder: boolean;
  showEditButton: boolean;
}) {
  const [lock, setLock] = useState(props.type != "overview" && props.private);

  const showToc = useMemo(() => {
    if (props.type == "article") return true;
    return false;
  }, [props.type]);

  const calContent = useMemo(() => {
    if (props.type == "overview") {
      if (props.private) {
        return "该文章已加密，点击「阅读全文」并输入密码后方可查看。";
      }
      const r = props.content.split("<!-- more -->");
      if (r.length > 1) {
        return r[0];
      } else {
        return props.content.substring(0, 50);
      }
    } else {
      return props.content.replace("<!-- more -->", "");
    }
  }, [props, lock, props.content]);

  return (
    <div className="nova-post-card-wrapper">
      <div className="nova-post-card">
        <Title
          type={props.type}
          id={props.id}
          title={props.title}
          openArticleLinksInNewWindow={props.openArticleLinksInNewWindow}
          showEditButton={props.showEditButton}
        />

        <SubTitle
          openArticleLinksInNewWindow={props.openArticleLinksInNewWindow}
          type={props.type}
          id={props.id}
          updatedAt={props.updatedAt}
          createdAt={props.createdAt}
          catelog={props.catelog}
          enableComment={props.enableComment}
        />

        <div className="nova-post-content">
          {props.type == "article" && (
            <NovaAlertCard
              showExpirationReminder={props.showExpirationReminder}
              updatedAt={props.updatedAt}
              createdAt={props.createdAt}
            />
          )}
          {lock ? (
            <div className="nova-lock-message">🔒 文章已加密</div>
          ) : (
            <>
              <Markdown content={calContent}></Markdown>
            </>
          )}
        </div>

        {props.type == "overview" && (
          <div className="nova-post-read-more">
            <Link
              href={`/post/${props.id}`}
              target={getTarget(props.openArticleLinksInNewWindow)}
            >
              <span className="nova-btn nova-btn-outline">
                阅读全文
              </span>
            </Link>
          </div>
        )}

        <PostBottom
          type={props.type}
          lock={lock}
          tags={props.tags}
          next={props.next}
          pre={props.pre}
          openArticleLinksInNewWindow={props.openArticleLinksInNewWindow}
        />

        {props.type !== "overview" && (
          <WaLine enable={props.enableComment} visible={true} />
        )}
      </div>
    </div>
  );
}
