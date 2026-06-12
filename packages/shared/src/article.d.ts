/**
 * 文章相关的共享类型。
 *
 * `Article` 是前台展示用的"公开文章"形状（与 website 原 `types/article.ts` 完全一致），
 * 不是后端的 mongoose 文档或输入 DTO —— 后端的 CreateArticleDto / UpdateArticleDto
 * 仍各自保留（那是输入校验，关注点不同）。本接口刻画的是 server 公开接口对外**返回**
 * 的文章结构，前后端据此对齐。
 */
export interface Article {
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  title: string;
  updatedAt: string;
  id: number;
  top?: number;
  private: boolean;
  author?: string;
  copyright?: string;
  pathname?: string;
}

/** `GET /api/public/article` 的分页返回结构。 */
export interface ArticleListResponse {
  articles: Article[];
  total: number;
  totalWordCount?: number;
}
