import { DonateItem } from "../api/getAllData";
import AuthorCard, { AuthorCardProps } from "../components/AuthorCard";
import Layout from "../components/Layout";
import PostCard from "../components/PostCard";
import { LayoutProps } from "../utils/getLayoutProps";
import { getAboutPageProps } from "../utils/getPageProps";
import { revalidate } from "../utils/loadConfig";
export interface About {
  updatedAt: string;
  // content 已在服务端（getAboutPageProps）拼好捐赠表，html 为其预渲染结果（去 bytemd 客户端水合）。
  // html 用 string | null（不用 undefined）：进 getStaticProps props，Next 禁止 undefined。
  content: string;
  html?: string | null;
}
export interface AboutPageProps {
  layoutProps: LayoutProps;
  authorCardProps: AuthorCardProps;
  donates: DonateItem[];
  about: About;
  pay: string[];
  payDark: string[];
  showDonateInfo: "true" | "false";
  showDonateInAbout: "true" | "false";
}
const AboutPage = (props: AboutPageProps) => {
  // 捐赠表拼接已移到服务端 getAboutPageProps，props.about.content 即最终展示内容。
  const content = props.about.content;

  return (
    <Layout
      title="关于我"
      option={props.layoutProps}
      sideBar={<AuthorCard option={props.authorCardProps} />}
    >
      <PostCard
        setContent={() => {}}
        showExpirationReminder={
          props.layoutProps.showExpirationReminder == "true"
        }
        openArticleLinksInNewWindow={false}
        id={0}
        key={"about"}
        private={false}
        title={"关于我"}
        updatedAt={new Date(props.about.updatedAt)}
        createdAt={new Date(props.about.updatedAt)}
        pay={props.pay}
        payDark={props.payDark}
        catelog={"about"}
        content={content}
        html={props.about.html}
        type={"about"}
        enableComment={props.layoutProps.enableComment}
        top={0}
        customCopyRight={null}
        showDonateInAbout={props.showDonateInAbout == "true"}
        copyrightAggreement={props.layoutProps.copyrightAggreement}
        showEditButton={props.layoutProps.showEditButton === "true"}
      ></PostCard>
    </Layout>
  );
};

export default AboutPage;
export async function getStaticProps(): Promise<{
  props: AboutPageProps;
  revalidate?: number;
}> {
  return {
    props: await getAboutPageProps(),
    ...revalidate,
  };
}
