import { useEffect, useMemo, useRef, useState } from "react";
import { searchArticles } from "../../api/search";
import { useDebounce } from "react-use";
import NovaKeyCard from "./NovaKeyCard";
import dayjs from "dayjs";

export default function NovaSearchCard(props: {
  visible: boolean;
  setVisible: (v: boolean) => void;
  openArticleLinksInNewWindow: boolean;
}) {
  const [result, setResult] = useState<any>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const innerRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key == "Escape") {
        props.setVisible(false);
      }
      if (ev.ctrlKey == true || ev.metaKey == true) {
        if (ev.key.toLocaleLowerCase() == "k") {
          props.setVisible(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [props]);

  const onSearch = async (search: string) => {
    setTyping(false);
    setLoading(true);
    const resultFromServer = await searchArticles(search);
    setResult(resultFromServer);
    setLoading(false);
  };

  useDebounce(
    () => {
      if (search.trim() !== "") {
        onSearch(search);
      }
    },
    500,
    [search]
  );

  const showClear = useMemo(() => {
    return search.trim() !== "";
  }, [search]);

  const renderResult = () => {
    let text = "";
    if (loading) {
      text = "搜索中...";
    } else {
      if (search.trim() == "") {
        text = "请输入并搜索";
      } else {
        if (result.length) {
          text = "有结果";
        } else {
          if (typing) {
            text = "输入中";
          } else {
            text = "暂无结果";
          }
        }
      }
    }

    if (text == "有结果") {
      return (
        <div className="nova-search-results">
          {result.map((article: any) => (
            <a
              key={article.id}
              href={`/post/${article.pathname}`}
              className="nova-search-result-item"
              onClick={() => {
                props.setVisible(false);
              }}
            >
              <span className="nova-search-result-date">
                {dayjs(article.createdAt).format("MM-DD")}
              </span>
              <span className="nova-search-result-title">{article.title}</span>
            </a>
          ))}
        </div>
      );
    } else {
      return (
        <div className="nova-search-empty">
          <span className="nova-search-empty-text">{text}</span>
        </div>
      );
    }
  };

  if (!props.visible) {
    return null;
  }

  return (
    <div
      className="nova-search-overlay"
      onClick={(ev) => {
        if (innerRef.current) {
          if (!(innerRef.current as any).contains(ev.target as any)) {
            props.setVisible(false);
          }
        }
      }}
    >
      <div
        ref={innerRef}
        className="nova-search-modal"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="nova-search-input-row">
          <svg
            viewBox="0 0 1024 1024"
            version="1.1"
            className="nova-search-icon"
          >
            <path d="M789.804097 737.772047 742.865042 784.699846 898.765741 940.600545 945.704796 893.672746Z" />
            <path d="M456.92259 82.893942c-209.311143 0-379.582131 170.282245-379.582131 379.582131s170.270988 379.570875 379.582131 379.570875c209.287607 0 379.558595-170.270988 379.558595-379.570875S666.210197 82.893942 456.92259 82.893942zM770.128989 462.477097c0 172.721807-140.508127 313.229934-313.206398 313.229934-172.720783 0-313.229934-140.508127-313.229934-313.229934s140.508127-313.229934 313.229934-313.229934C629.620861 149.247162 770.128989 289.75529 770.128989 462.477097z" />
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={(ev) => {
              setTyping(true);
              setSearch(ev.currentTarget.value);
              if (ev.currentTarget.value.trim() == "") {
                setResult([]);
              }
            }}
            placeholder="搜索内容"
            className="nova-search-input"
            autoFocus
          />
          <div
            className="nova-search-clear"
            style={{ visibility: showClear ? "visible" : "hidden" }}
            onClick={() => {
              setSearch("");
              setResult([]);
            }}
          >
            <svg viewBox="0 0 1024 1024" className="nova-search-clear-icon">
              <path d="M512 39.384615C250.092308 39.384615 39.384615 250.092308 39.384615 512s210.707692 472.615385 472.615385 472.615385 472.615385-210.707692 472.615385-472.615385S773.907692 39.384615 512 39.384615z m96.492308 488.369231l153.6 153.6c7.876923 7.876923 7.876923 19.692308 0 27.569231l-55.138462 55.138461c-7.876923 7.876923-19.692308 7.876923-27.569231 0L525.784615 610.461538c-7.876923-7.876923-19.692308-7.876923-27.56923 0l-153.6 153.6c-7.876923 7.876923-19.692308 7.876923-27.569231 0L261.907692 708.923077c-7.876923-7.876923-7.876923-19.692308 0-27.569231l153.6-153.6c7.876923-7.876923 7.876923-19.692308 0-27.569231l-155.56923-155.56923c-7.876923-7.876923-7.876923-19.692308 0-27.569231l55.138461-55.138462c7.876923-7.876923 19.692308-7.876923 27.569231 0l155.569231 155.569231c7.876923 7.876923 19.692308 7.876923 27.56923 0l153.6-153.6c7.876923-7.876923 19.692308-7.876923 27.569231 0l55.138462 55.138462c7.876923 7.876923 7.876923 19.692308 0 27.56923l-153.6 153.6c-5.907692 7.876923-5.907692 19.692308 0 27.569231z" />
            </svg>
          </div>
          <NovaKeyCard type="esc" />
        </div>
        <div className="nova-search-divider" />
        <div className="nova-search-content">{renderResult()}</div>
      </div>
    </div>
  );
}
