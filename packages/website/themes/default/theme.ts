import Layout from '../../components/Layout';
import LayoutBody from '../../components/LayoutBody';
import NavBar from '../../components/NavBar';
import NavBarMobile from '../../components/NavBarMobile';
import Footer from '../../components/Footer';
import AuthorCard from '../../components/AuthorCard';
import ArticleList from '../../components/ArticleList';
import PostCard from '../../components/PostCard';
import TimeLineItem from '../../components/TimeLineItem';
import LinkCard from '../../components/LinkCard';
import SearchCard from '../../components/SearchCard';
import KeyCard from '../../components/KeyCard';
import AlertCard from '../../components/AlertCard';
import SocialCard from '../../components/SocialCard';
import { Theme } from '../types';

export const defaultTheme: Theme = {
  config: {
    name: 'default',
    description: 'VanBlog 默认主题',
    version: '1.0.0',
    author: 'Mereith',
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
    TimeLineItem,
    LinkCard,
    SearchCard,
    KeyCard,
    AlertCard,
    SocialCard,
  },
};

export default defaultTheme;
