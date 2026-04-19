import Link from "next/link";
import { useState } from "react";
import { MenuItem } from "../../api/getAllData";
import NovaSearchCard from "./NovaSearchCard";

interface NavBarProps {
  logo: string;
  logoDark: string;
  categories: string[];
  setOpen: (open: boolean) => void;
  isOpen: boolean;
  siteName: string;
  menus: MenuItem[];
  showSubMenu: "true" | "false";
  showAdminButton: "true" | "false";
  showFriends: "true" | "false";
  showRSS: "true" | "false";
  headerLeftContent: "siteName" | "siteLogo";
  defaultTheme: "dark" | "auto" | "light";
  subMenuOffset: number;
  openArticleLinksInNewWindow: boolean;
}

export default function NovaNavBar(props: NavBarProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <NovaSearchCard
        visible={showSearch}
        setVisible={setShowSearch}
        openArticleLinksInNewWindow={props.openArticleLinksInNewWindow}
      />
      <nav className="nova-nav">
        <div className="nova-nav-inner">
          <Link href="/" className="nova-nav-wordmark">
            {props.headerLeftContent === "siteLogo" ? (
              <img src={props.logo} alt={props.siteName} style={{ height: 48 }} />
            ) : (
              props.siteName.toUpperCase()
            )}
          </Link>

        <div className="nova-nav-links">
          {props.menus?.map((menu) => (
            <Link
              key={menu.id}
              href={menu.value}
              className="nova-nav-link"
            >
              {menu.name.toUpperCase()}
            </Link>
          ))}
          {props.showRSS === "true" && (
            <Link href="/feed.xml" className="nova-nav-link">
              RSS
            </Link>
          )}
        </div>

          <div className="nova-nav-actions">
            <div
              className="nova-nav-search"
              onClick={() => {
                setShowSearch(true);
                document.body.style.overflow = "hidden";
              }}
              title="搜索"
            >
              <svg
                viewBox="0 0 1024 1024"
                version="1.1"
                className="nova-nav-search-icon"
              >
                <path d="M789.804097 737.772047 742.865042 784.699846 898.765741 940.600545 945.704796 893.672746Z" />
                <path d="M456.92259 82.893942c-209.311143 0-379.582131 170.282245-379.582131 379.582131s170.270988 379.570875 379.582131 379.570875c209.287607 0 379.558595-170.270988 379.558595-379.570875S666.210197 82.893942 456.92259 82.893942zM770.128989 462.477097c0 172.721807-140.508127 313.229934-313.206398 313.229934-172.720783 0-313.229934-140.508127-313.229934-313.229934s140.508127-313.229934 313.229934-313.229934C629.620861 149.247162 770.128989 289.75529 770.128989 462.477097z" />
              </svg>
              <span className="nova-nav-search-hint">Ctrl+K</span>
            </div>
            {props.showAdminButton === "true" && (
              <Link href="/admin" className="nova-btn nova-btn-primary">
                MANAGE
              </Link>
            )}
          </div>

          <div className="nova-nav-mobile">
            <div
              className="nova-nav-hamburger"
              onClick={() => props.setOpen(!props.isOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
