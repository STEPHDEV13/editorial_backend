import { Request, Response, NextFunction } from 'express';
import * as articleService from '../services/articleService';
import * as notificationService from '../services/notificationService';
import * as networkService from '../services/networkService';
import { buildArticleNotificationEmail } from '../utils/emailTemplate';
import { sendMail } from '../utils/mailer';
import { ArticleFilters } from '../models';

export function getArticles(req: Request, res: Response, next: NextFunction): void {
  try {
    // parsedQuery is set by validateQuery middleware
    const query = (req as Request & { parsedQuery: Record<string, unknown> }).parsedQuery as {
      page: number;
      limit: number;
      search?: string;
      status?: 'draft' | 'published' | 'archived';
      categoryIds?: string;
      networkId?: string;
      featured?: boolean;
      sortBy: string;
      sortDir: 'asc' | 'desc';
    };

    const filters: ArticleFilters = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      categoryIds: query.categoryIds
        ? query.categoryIds.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      networkId: query.networkId,
      featured: query.featured,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    };

    const result = articleService.getArticles(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export function getArticleById(req: Request, res: Response, next: NextFunction): void {
  try {
    const article = articleService.getArticleById(req.params.id);
    res.json(article);
  } catch (err) {
    next(err);
  }
}

export function createArticle(req: Request, res: Response, next: NextFunction): void {
  try {
    const article = articleService.createArticle(req.body);
    res.status(201).json(article);
  } catch (err) {
    next(err);
  }
}

export function updateArticle(req: Request, res: Response, next: NextFunction): void {
  try {
    const article = articleService.updateArticle(req.params.id, req.body);
    res.json(article);
  } catch (err) {
    next(err);
  }
}

export function deleteArticle(req: Request, res: Response, next: NextFunction): void {
  try {
    articleService.deleteArticle(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export function patchArticleStatus(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const article = articleService.patchArticleStatus(
      req.params.id,
      req.body.status
    );
    res.json(article);
  } catch (err) {
    next(err);
  }
}

export async function notifyArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const article = articleService.getArticleById(req.params.id);

    const recipients: string[] = Array.isArray(req.body?.recipients)
      ? req.body.recipients.filter((r: unknown) => typeof r === 'string' && r.trim())
      : [];
    const subject: string = req.body?.subject?.trim() || `Nouvel article : ${article.title}`;

    // Retrieve network name if applicable
    let networkName: string | undefined;
    if (article.networkId) {
      const networks = networkService.getAllNetworks();
      const network = networks.find((n) => n.id === article.networkId);
      networkName = network?.name;
    }

    // Build the email HTML
    const html = buildArticleNotificationEmail({
      title: 'Nouvelle publication éditoriale',
      articleTitle: article.title,
      articleExcerpt: article.excerpt,
      articleUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/articles/${article.slug}`,
      authorName: article.authorName,
      publishedAt: article.publishedAt ?? new Date().toISOString(),
      networkName,
    });

    // Attempt email delivery
    let status: 'sent' | 'failed' = 'sent';
    let sentAt: string | null = null;
    if (recipients.length > 0) {
      try {
        await sendMail({ to: recipients, subject, html });
        sentAt = new Date().toISOString();
      } catch (mailErr) {
        console.error('[mailer] sendMail failed:', mailErr);
        status = 'failed';
      }
    }

    // Store notification record
    const notification = notificationService.createNotification({
      type:       status === 'sent' ? 'success' : 'error',
      title:      status === 'sent' ? 'Notification envoyée' : 'Échec de l\'envoi',
      message:    `Article : « ${article.title} » — ${recipients.length} destinataire(s)`,
      articleId:  article.id,
      recipients,
      subject,
      html,
      sentAt,
      status,
    });

    res.json({ html, message: notification.message, notification });
  } catch (err) {
    next(err);
  }
}
