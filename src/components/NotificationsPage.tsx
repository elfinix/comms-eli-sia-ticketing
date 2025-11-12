import { Bell, CheckCircle, AlertCircle, Info, Users, Clock, Check, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { getTimeAgo } from '../data/notificationsData';
import { useNotifications } from '../contexts/NotificationsContext';
import { Button } from './ui/button';
import { supabase } from '../lib/supabaseClient';

interface NotificationsPageProps {
  onNavigateToChat?: () => void;
}

export default function NotificationsPage({ onNavigateToChat }: NotificationsPageProps) {
  const { notifications: allNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Get only sent notifications
  const notifications = allNotifications.filter(n => n.status === 'sent');

  const typeIcons = {
    info: Info,
    warning: AlertCircle,
    success: CheckCircle,
    error: AlertCircle,
  };

  const typeColors = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  const isChatNotification = (notification: any) => {
    return notification.title.includes('New Message') || notification.title.includes('Message from');
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    markAsRead(notification.id);
    
    // If it's a chat notification, look up sender and navigate to chat
    if (isChatNotification(notification) && onNavigateToChat) {
      // Parse sender name from title: "New Message from <sender>"
      const senderName = notification.title.replace('New Message from ', '').trim();
      
      // Look up sender's user_id from users table
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('name', senderName)
        .limit(1);
      
      if (!error && users && users.length > 0) {
        sessionStorage.setItem('chatContactId', users[0].id);
      }
      
      onNavigateToChat();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
            Notifications
          </h2>
          <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={markAllAsRead}
            variant="outline"
            className="gap-2"
          >
            <Check size={18} />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => {
              const TypeIcon = typeIcons[notification.type];
              const isChat = isChatNotification(notification);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 transition-colors ${
                    notification.unread ? 'bg-blue-50/30' : ''
                  } ${isChat ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                >
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-lg ${typeColors[notification.type]} flex-shrink-0 h-fit`}>
                      <TypeIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-['Abel',sans-serif] text-gray-900 truncate">
                          {notification.title}
                        </h3>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-[#8B0000] rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-['Abel',sans-serif] mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      {/* Only show "system-wide announcement" for admin notifications, not chat messages */}
                      {!isChat && (
                        <p className="text-xs text-gray-500 font-['Abel',sans-serif] mb-2">
                          This is a system-wide announcement from the Administrator
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400 font-['Abel',sans-serif]">
                          {getTimeAgo(notification.sentAt || notification.createdAt)}
                        </span>
                        {/* Show indicator for chat messages */}
                        {isChat && (
                          <span className="text-xs text-[#8B0000] font-['Abel',sans-serif] flex items-center gap-1">
                            <MessageSquare size={12} />
                            Click to view chat
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-['Abel',sans-serif]">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}