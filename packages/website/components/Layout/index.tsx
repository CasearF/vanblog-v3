import Head from "next/head";
import BackToTopBtn from "../BackToTop";
import NavBar from "../NavBar";
import NavBarMobile from "../NavBarMobile";
import Footer from "../Footer";
import LayoutBody from "../LayoutBody";
import { useEffect, useRef, useState } from "react";
import BaiduAnalysis from "../BaiduAnalysis";
import GaAnalysis from "../gaAnalysis";
import { LayoutProps } from "../../utils/getLayoutProps";
import { RealThemeType, ThemeContext } from "../../utils/themeContext";
import { getTheme } from "../../utils/theme";
import CustomLayout from "../CustomLayout";
import { Toaster } from "react-hot-toast";
import { ThemeComponents } from "../../themes/types";
import defaultTheme from "../../themes/default/theme";
import novaTheme from "../../themes/nova/theme";

const themesComponents: Record<string, ThemeComponents> = {
  default: defaultTheme.components,
  nova: novaTheme.components,
};

export default function (props: {
  option: LayoutProps;
  title: string;
  sideBar: any;
  children: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { current } = useRef({ hasInit: false });
  const [theme, setTheme] = useState<RealThemeType>(getTheme("auto"));

  const themeName = props.option.theme || 'default';
  const themeComponents = themesComponents[themeName] || themesComponents.default;

  const NavBarComponent = themeComponents.NavBar || NavBar;
  const NavBarMobileComponent = themeComponents.NavBarMobile || NavBarMobile;
  const LayoutBodyComponent = themeComponents.LayoutBody || LayoutBody;
  const FooterComponent = themeComponents.Footer || Footer;

  const handleClose = () => {
    console.log("关闭或刷新页面");
    localStorage.removeItem("saidHello");
  };
  useEffect(() => {
    if (!current.hasInit && !localStorage.getItem("saidHello")) {
      current.hasInit = true;
      localStorage.setItem("saidHello", "true");
      console.log("🚀欢迎使用 VanBlog 博客系统");
      console.log("当前版本：", props?.option?.version || "未知");
      console.log("项目主页：", "https://vanblog.mereith.com");
      console.log("开源地址：", "https://github.com/mereithhh/van-blog");
      console.log("喜欢的话可以给个 star 哦🙏");
      window.onbeforeunload = handleClose;
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [props]);

  useEffect(() => {
    if (themeName === 'nova') {
      document.body.classList.add('nova-theme');
    } else {
      document.body.classList.remove('nova-theme');
    }
  }, [themeName]);

  return (
    <>
      <Head>
        <title>{props.title}</title>
        <link rel="icon" href={props.option.favicon}></link>
        <meta name="description" content={props.option.description}></meta>
        <meta name="robots" content="index, follow"></meta>
      </Head>
      <BackToTopBtn></BackToTopBtn>
      {props.option.baiduAnalysisID != "" &&
        process.env.NODE_ENV != "development" && (
          <BaiduAnalysis id={props.option.baiduAnalysisID}></BaiduAnalysis>
        )}

      {props.option.gaAnalysisID != "" &&
        process.env.NODE_ENV != "development" && (
          <GaAnalysis id={props.option.gaAnalysisID}></GaAnalysis>
        )}
      <ThemeContext.Provider
        value={{
          setTheme,
          theme,
        }}
      >
        <Toaster />
        <NavBarComponent
          openArticleLinksInNewWindow={
            props.option.openArticleLinksInNewWindow == "true"
          }
          showRSS={props.option.showRSS}
          defaultTheme={props.option.defaultTheme}
          showSubMenu={props.option.showSubMenu}
          headerLeftContent={props.option.headerLeftContent}
          subMenuOffset={props.option.subMenuOffset}
          showAdminButton={props.option.showAdminButton}
          menus={props.option.menus}
          siteName={props.option.siteName}
          logo={props.option.logo}
          categories={props.option.categories}
          isOpen={isOpen}
          setOpen={setIsOpen}
          logoDark={props.option.logoDark}
          showFriends={props.option.showFriends}
        />
        <NavBarMobileComponent
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          showAdminButton={props.option.showAdminButton}
          showFriends={props.option.showFriends}
          menus={props.option.menus}
        />

        <div className={themeName === 'nova' ? 'nova-theme' : ''}>
          <div className={themeName === 'nova' 
            ? 'nova-container nova-mt-4' 
            : 'mx-auto lg:px-6 md:py-4 py-2 px-2 md:px-4 text-gray-700'}>
            <LayoutBodyComponent children={props.children} sideBar={props.sideBar} />
            <FooterComponent
              ipcHref={props.option.ipcHref}
              ipcNumber={props.option.ipcNumber}
              since={props.option.since}
              version={props.option.version}
              gaBeianLogoUrl={props.option.gaBeianLogoUrl}
              gaBeianNumber={props.option.gaBeianNumber}
              gaBeianUrl={props.option.gaBeianUrl}
            />
          </div>
        </div>
      </ThemeContext.Provider>
      {props.option.enableCustomizing == "true" && (
        <CustomLayout
          customCss={props.option.customCss}
          customHtml={props.option.customHtml}
          customScript={props.option.customScript}
          customHead={props.option.customHead}
        />
      )}
    </>
  );
}
