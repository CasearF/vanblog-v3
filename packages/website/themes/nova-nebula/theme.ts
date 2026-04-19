import Layout from '../../components/Layout';
import LayoutBody from './NovaLayoutBody';
import NavBar from './NovaNavBar';
import NavBarMobile from '../../components/NavBarMobile';
import Footer from './NovaFooter';
import AuthorCard from './NovaAuthorCard';
import ArticleList from './NovaArticleCard';
import PostCard from './NovaPostCard';
import { NovaTimelineItem } from './NovaTimeline';
import LinkCard from './NovaLinkCard';
import SearchCard from './NovaSearchCard';
import KeyCard from './NovaKeyCard';
import AlertCard from './NovaAlertCard';
import SocialCard from './NovaSocialCard';
import { Theme } from '../types';

export const novaNebulaTheme: Theme = {
  config: {
    name: 'nova-nebula',
    description: 'VanBlog Nova Nebula 主题 - Nova 星云风格',
    version: '1.0.0',
    author: 'Custom',
  },
  components: {
    Layout,
    LayoutBody,
    NavBar,
    NavBarMobile,
    Footer,
    AuthorCard,
    ArticleList,
    PostCard,
    TimeLineItem: NovaTimelineItem,
    LinkCard,
    SearchCard,
    KeyCard,
    AlertCard,
    SocialCard,
  },
};

export default novaNebulaTheme;
