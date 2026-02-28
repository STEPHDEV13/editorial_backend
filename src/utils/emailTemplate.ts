export interface EmailTemplateData {
  title: string;
  articleTitle: string;
  articleExcerpt: string;
  articleUrl: string;
  authorName: string;
  publishedAt: string;
  networkName?: string;
}

/**
 * Generates a reusable HTML email template for article notifications.
 */
export function buildArticleNotificationEmail(data: EmailTemplateData): string {
  const {
    title,
    articleTitle,
    articleExcerpt,
    articleUrl,
    authorName,
    publishedAt,
    networkName,
  } = data;

  const formattedDate = new Date(publishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #333333;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .header {
      background-color: #1a1a2e;
      padding: 28px 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 22px;
      margin: 0;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header p.network {
      color: #a0aec0;
      font-size: 13px;
      margin: 6px 0 0;
    }
    .body {
      padding: 32px;
    }
    .label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #e63946;
      margin-bottom: 8px;
    }
    .article-title {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 16px;
      line-height: 1.3;
    }
    .excerpt {
      font-size: 15px;
      color: #555555;
      line-height: 1.7;
      margin: 0 0 24px;
    }
    .meta {
      font-size: 13px;
      color: #888888;
      border-top: 1px solid #eeeeee;
      padding-top: 16px;
      margin-bottom: 24px;
    }
    .meta strong {
      color: #555555;
    }
    .cta {
      display: inline-block;
      background-color: #e63946;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #aaaaaa;
      border-top: 1px solid #eeeeee;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      ${networkName ? `<p class="network">${escapeHtml(networkName)}</p>` : ''}
    </div>
    <div class="body">
      <p class="label">Nouvel article publié</p>
      <h2 class="article-title">${escapeHtml(articleTitle)}</h2>
      <p class="excerpt">${escapeHtml(articleExcerpt)}</p>
      <div class="meta">
        <strong>Auteur :</strong> ${escapeHtml(authorName)}<br />
        <strong>Publié le :</strong> ${formattedDate}
      </div>
      <a href="${escapeHtml(articleUrl)}" class="cta">Lire l'article complet</a>
    </div>
    <div class="footer">
      Vous recevez cet e-mail car vous êtes abonné aux notifications éditoriales.<br />
      &copy; ${new Date().getFullYear()} CMS Editorial – Tous droits réservés.
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
