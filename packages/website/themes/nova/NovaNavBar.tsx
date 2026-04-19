import Link from "next/link";
import { MenuItem } from "../../api/getAllData";

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
  return (
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
          <Link href="/" className="nova-nav-link">
            HOME
          </Link>
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

        <div className="nova-nav-cta">
          <Link href="/admin" className="nova-btn nova-btn-primary">
            MANAGE
          </Link>
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
  );
}
