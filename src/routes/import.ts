import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as importService from '../services/importService';
import * as notificationService from '../services/notificationService';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'application/json' || file.originalname.endsWith('.json');
    ok ? cb(null, true) : cb(new Error('Seuls les fichiers JSON sont acceptés'));
  },
});

router.post(
  '/articles',
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // ── Debug (retirez après résolution) ──────────────────────────────
      console.log('[import] content-type :', req.headers['content-type']);
      console.log('[import] req.file     :', req.file?.originalname ?? 'none');
      console.log('[import] req.body keys:', Object.keys(req.body ?? {}));

      // ── Résolution du payload ─────────────────────────────────────────
      let payload: unknown;

      if (req.file) {
        // Cas 1 : fichier multipart envoyé via FormData
        const text = req.file.buffer.toString('utf-8');
        try {
          const parsed = JSON.parse(text);
          // Le fichier peut être { articles: [...] } ou directement [...]
          if (Array.isArray(parsed)) {
            payload = { articles: parsed };                          // tableau brut → wrap
            } else if (parsed?.articles) {
            payload = parsed;                                        // déjà { articles: [...] } → ne pas re-wrapper
            } else {
            payload = { articles: [parsed] };                        // objet unique → wrap
            }
        } catch {
          res.status(400).json({ message: 'Fichier JSON invalide ou mal formé' });
          return;
        }
      } else if (Array.isArray(req.body)) {
        // Cas 2 : body JSON = tableau brut
        payload = { articles: req.body };
      } else if (
        req.body &&
        typeof req.body === 'object' &&
        'articles' in req.body
      ) {
        // Cas 3 : body JSON = { articles: [...] }
        payload = req.body;
      } else if (
        req.body &&
        typeof req.body === 'object' &&
        Object.keys(req.body).length > 0
      ) {
        // Cas 4 : body JSON = objet article unique
        payload = { articles: [req.body] };
      } else {
        res.status(400).json({
          message:
            'Corps de requête vide. Envoyez un fichier JSON (multipart) ou { articles: [...] } en JSON.',
        });
        return;
      }

      console.log('[import] payload shape:', JSON.stringify(payload).slice(0, 200));

      // ── Import ────────────────────────────────────────────────────────
      const result = importService.importArticles(payload);

      // ── Notification (non-bloquante) ──────────────────────────────────
      try {
        notificationService.createNotification({
          type: result.errors.length === 0 ? 'success' : 'warning',
          title: "Import d'articles terminé",
          message: `${result.imported} article(s) importé(s). ${result.skipped} ignoré(s).`,
        });
      } catch (e) {
        console.warn('[import] notification échouée:', e);
      }

      res.status(200).json(result);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Invalid import payload')) {
        res.status(400).json({ message: err.message });
        return;
      }
      next(err);
    }
  }
);

export default router;