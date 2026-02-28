export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Network {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ArticleStatus;
  featured: boolean;
  categoryIds: string[];
  networkId: string | null;
  authorName: string;
  coverImageUrl?: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  articleId?: string;
  read: boolean;
  createdAt: string;
}

export interface Database {
  categories: Category[];
  networks: Network[];
  articles: Article[];
  notifications: Notification[];
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ArticleFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ArticleStatus;
  categoryIds?: string[];
  networkId?: string;
  featured?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
