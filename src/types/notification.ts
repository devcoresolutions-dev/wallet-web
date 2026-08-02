export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  refId: string;
  status: NotificationStatus;
  sentAt?: string;
  createdAt: string;
}
