import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNotifications as useSupabaseNotifications } from '../lib/hooks/useNotifications';
import { Notification as DBNotification } from '../lib/types';

// Legacy notification type for compatibility
interface LegacyNotification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  unread: boolean;
  status: 'sent' | 'draft';
}

interface NotificationsContextType {
  notifications: LegacyNotification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const { notifications: dbNotifications, loading, markAsRead: markDbAsRead, markAllAsRead: markDbAllAsRead } = useSupabaseNotifications(userId || '');
  const [notifications, setNotifications] = useState<LegacyNotification[]>([]);

  // Convert DB notifications to legacy format
  useEffect(() => {
    if (dbNotifications) {
      const converted = dbNotifications.map((notif, index) => ({
        id: index + 1, // Use index as legacy ID
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.created_at).toLocaleString(),
        type: notif.type,
        unread: !notif.is_read,
        status: 'sent' as const,
        dbId: notif.id, // Keep reference to DB ID
        ticket_id: notif.ticket_id, // Pass through ticket_id for navigation
        recipients: 'You', // For display purposes
        sentAt: notif.created_at,
        createdAt: notif.created_at,
      }));
      setNotifications(converted as any);
    }
  }, [dbNotifications]);

  const unreadCount = notifications.filter(n => n.unread && n.status === 'sent').length;

  const markAsRead = async (id: number) => {
    // Find the notification and mark it in DB
    const notif = notifications[id - 1];
    if (notif && (notif as any).dbId) {
      await markDbAsRead((notif as any).dbId);
    }
    
    // Update local state immediately for better UX
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const markAllAsRead = async () => {
    await markDbAllAsRead();
    
    // Update local state
    setNotifications(prev =>
      prev.map(n => ({ ...n, unread: false }))
    );
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        loading,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within NotificationsProvider');
  }
  return context;
}

// Keep the old export for backward compatibility
export { useNotificationsContext as useNotifications };