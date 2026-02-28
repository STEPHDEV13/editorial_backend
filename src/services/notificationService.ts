import { Notification, NotificationType } from '../models';
import { readDb, writeDb } from '../utils/fileStorage';
import { generateId } from '../utils/idGenerator';

export function getAllNotifications(): Notification[] {
  const db = readDb();
  return [...db.notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createNotification(params: {
  type: NotificationType;
  title: string;
  message: string;
  articleId?: string;
}): Notification {
  const db = readDb();

  const notification: Notification = {
    id: generateId('notif'),
    type: params.type,
    title: params.title,
    message: params.message,
    articleId: params.articleId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.notifications.unshift(notification);
  writeDb(db);
  return notification;
}
