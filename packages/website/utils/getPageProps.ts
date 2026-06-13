import { getPublicMeta } from "../api/getAllData";
import { IndexPageProps } from "../pages/index";
import { TagPageProps } from "../pages/tag";
import { TimeLinePageProps } from "../pages/timeline";
import { CategoryPageProps } from "../pages/category";
import { getAuthorCardProps, getLayoutProps } from "./getLayoutProps";
import { washArticlesByKey } from "./washArticles";
import { AboutPageProps } from "../pages/about";
import { TagPagesProps } from "../pages/tag/[tag]";
import { PostPagesProps } from "../pages/post/[id]";
import { PagePagesProps } from "../pages/page/[p]";
import { CategoryPagesProps } from "../pages/category/[category]";
import {
  getArticleByIdOrPathname,
  getArticlesByCategory,
  getArticlesByOption,
  getArticlesByTimeLine,
} from "../api/getArticles";
import { LinkPageProps } from "../pages/link";
import { renderStaticHtml } from "./markdownToHtml";
import { overviewMarkdown, stripMore } from "./displayContent";
import { DonateItem } from "../api/getAllData";
import dayjs from "dayjs";

// 给一组文章（列表/概览卡）附加服务端预渲染的摘要 HTML（去 bytemd 客户端水合）。
// 含 mermaid / 内容为空时 renderStaticHtml 返回 undefined，卡片会回退到客户端渲染。
function attachOverviewHtml<T extends { content?: string; private?: boolean }>(
  articles: T[]
): (T & { html?: string | null })[] {
  // html 为 string | null（renderStaticHtml 在空/mermaid 时返回 null）——
  // 不能是 undefined，否则进 getStaticProps props 会触发 Next 序列化报错。
  return (articles || []).map((article) => ({
    ...article,
    html: renderStaticHtml(overviewMarkdown(article)),
  }));
}

// about 页捐赠信息表（原内联在 pages/about.tsx，移到服务端以便整页预渲染）。
function getDonateTableMarkdown(donates: DonateItem[]) {
  let content = `
## 捐赠信息

| 捐赠人 | 捐赠金额|捐赠时间|
|---|---|---|
  `;
  for (const each of donates) {
    content =
      content +
      `|${each.name}|${each.value} 元|${dayjs(each.updatedAt).format(
        "YYYY-MM-DD HH:mm:ss"
      )}|\n`;
  }
  return content;
}

export async function getIndexPageProps(): Promise<IndexPageProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const authorCardProps = getAuthorCardProps(data);
  const { articles } = await getArticlesByOption({
    page: 1,
    pageSize: 5,
  });
  return {
    layoutProps,
    articles: attachOverviewHtml(articles),
    currPage: 1,
    authorCardProps,
  };
}

export async function getTimeLinePageProps(): Promise<TimeLinePageProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const authorCardProps = getAuthorCardProps(data);
  const sortedArticles = await getArticlesByTimeLine();
  const wordTotal = data.totalWordCount;
  return {
    layoutProps,
    authorCardProps,
    sortedArticles,
    wordTotal,
  };
}
export async function getTagPageProps(): Promise<TagPageProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const authorCardProps = getAuthorCardProps(data);
  const tags = data.tags;
  return {
    layoutProps,
    authorCardProps,
    tags,
  };
}
export async function getCategoryPageProps(): Promise<CategoryPageProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const authorCardProps = getAuthorCardProps(data);
  const wordTotal = data.totalWordCount;
  const sortedArticles = await getArticlesByCategory();
  return {
    layoutProps,
    authorCardProps,
    wordTotal,
    sortedArticles,
  };
}
export async function getLinkPageProps(): Promise<LinkPageProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const authorCardProps = getAuthorCardProps(data);
  return {
    layoutProps,
    authorCardProps,
    links: data.meta.links,
  };
}
export async function getAboutPageProps(): Promise<AboutPageProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const authorCardProps = getAuthorCardProps(data);
  const about = data.meta.about;
  let showDonateInfo: "true" | "false" = "true";
  if (data.meta.siteInfo?.showDonateInfo == "false") {
    showDonateInfo = "false";
  }
  let showDonateInAbout: "true" | "false" = "false";

  if (data.meta.siteInfo?.showDonateInAbout == "true") {
    showDonateInAbout = "true";
  }
  if (data.meta.siteInfo?.showDonateButton == "false") {
    showDonateInAbout = "false";
  }
  const payProps = {
    pay: [
      data.meta.siteInfo?.payAliPay || "",
      data.meta.siteInfo?.payWechat || "",
    ],
    payDark: [
      data.meta.siteInfo?.payAliPayDark || "",
      data.meta.siteInfo?.payWechatDark || "",
    ],
  };
  // 把捐赠表拼接 + 正文预渲染都放到服务端，整页走 StaticMarkdown（去 bytemd 客户端水合）。
  // 拼接条件与原 pages/about.tsx 的 useMemo 一致：有捐赠记录且未关闭捐赠信息时追加。
  const donates = data.meta?.rewards || [];
  const aboutContent =
    donates.length > 0 && showDonateInfo !== "false"
      ? `${about.content}${getDonateTableMarkdown(donates)}`
      : about.content;
  const aboutWithHtml = {
    ...about,
    content: aboutContent,
    html: renderStaticHtml(stripMore(aboutContent)),
  };
  return {
    showDonateInfo,
    layoutProps,
    authorCardProps,
    about: aboutWithHtml,
    donates,
    showDonateInAbout,
    ...payProps,
  };
}
export async function getTagPagesProps(
  currTag: string
): Promise<TagPagesProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const authorCardProps = getAuthorCardProps(data);
  const {
    articles: articlesInThisTag,
    total,
    totalWordCount,
  } = await getArticlesByOption({
    page: 1,
    pageSize: -1,
    tags: currTag,
    withWordCount: true,
    toListView: true,
  });
  const wordTotal = totalWordCount || 0;
  const curNum = total;
  const sortedArticles = washArticlesByKey(
    articlesInThisTag,
    (each) => new Date(each.createdAt).getFullYear(),
    false
  );
  return {
    layoutProps,
    authorCardProps,
    currTag,
    sortedArticles,
    curNum,
    wordTotal,
  };
}

export async function getPostPagesProps(
  curId: string
): Promise<PostPagesProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const payProps = {
    pay: [
      data.meta.siteInfo?.payAliPay || "",
      data.meta.siteInfo?.payWechat || "",
    ],
    payDark: [
      data.meta.siteInfo?.payAliPayDark || "",
      data.meta.siteInfo?.payWechatDark || "",
    ],
  };
  const currArticleProps = await getArticleByIdOrPathname(curId);
  const { article } = currArticleProps;
  const author = article?.author || data.meta.siteInfo.author;
  return {
    layoutProps,
    ...currArticleProps,
    // 服务端预渲染全文 HTML（去 bytemd 客户端水合）。条件展开：仅当 article 存在才覆盖它，
    // 否则保持「不存在 article 键」的原行为（页面据此渲染 404）——绝不写出 article: undefined，
    // 那会触发 Next 的 getStaticProps 序列化报错。html 为 string | null（加密/ mermaid/空时 null，回退客户端渲染）。
    ...(article
      ? { article: { ...article, html: renderStaticHtml(stripMore(article.content)) } }
      : {}),
    ...payProps,
    author,
    showSubMenu: layoutProps.showSubMenu,
  };
}
export async function getPagePagesProps(
  curId: string
): Promise<PagePagesProps> {
  const data = await getPublicMeta();
  const layoutProps = getLayoutProps(data);
  const authorCardProps = getAuthorCardProps(data);
  const currPage = parseInt(curId);
  const { articles } = await getArticlesByOption({
    page: currPage,
    pageSize: 5,
  });
  return {
    layoutProps,
    articles: attachOverviewHtml(articles),
    currPage,
    authorCardProps,
  };
}
export async function getCategoryPagesProps(
  curCategory: string
): Promise<CategoryPagesProps> {
  const data = await getPublicMeta();
  const authorCardProps = getAuthorCardProps(data);
  const layoutProps = getLayoutProps(data);
  const {
    articles: articlesInThisCategory,
    total,
    totalWordCount,
  } = await getArticlesByOption({
    page: 1,
    pageSize: -1,
    category: curCategory,
    withWordCount: true,
    toListView: true,
  });

  const wordTotal = totalWordCount as number;
  const curNum = total;
  const sortedArticles = washArticlesByKey(
    articlesInThisCategory,
    (each) => each.category,
    false
  );
  return {
    layoutProps,
    curCategory,
    sortedArticles,
    authorCardProps,
    wordTotal,
    curNum,
  };
}
