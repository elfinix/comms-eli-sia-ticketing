import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { getTimeAgo } from '../data/notificationsData';
import { useNotifications } from '../contexts/NotificationsContext';
import { useState } from 'react';
import NotificationDetailsDialog from './NotificationDetailsDialog';
import { supabase } from '../lib/supabaseClient';

interface NotificationBellDropdownProps {
  onViewAll: () => void;
  userRole?: 'student' | 'faculty' | 'ict' | 'admin';
  onTicketClick?: (ticketId: string) => void;
  onNavigateToChat?: () => void;
}

export default function NotificationBellDropdown({ onViewAll, userRole, onTicketClick, onNavigateToChat }: NotificationBellDropdownProps) {
  const { notifications: allNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Get only sent notifications, sorted by date (most recent first)
  const notifications = allNotifications
    .filter(n => n.status === 'sent')
    .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime())
    .slice(0, 5); // Show only latest 5

  // Mark all as read when dropdown opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    console.log('Notification clicked:', notification);
    
    // Check if it's a chat message notification
    const isChatMessage = notification.title.includes('New Message') || notification.title.includes('Message from');
    console.log('Is chat message:', isChatMessage);
    
    // Check if notification has a ticket_id (from raw DB data)
    const ticketId = (notification as any).ticketId || (notification as any).ticket_id;
    
    if (isChatMessage && onNavigateToChat) {
      // Parse sender name from title: "New Message from <sender>"
      const senderName = notification.title.replace('New Message from ', '').trim();
      console.log('Parsed sender name:', senderName);
      
      // Look up sender's user_id from users table
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('name', senderName)
        .limit(1);
      
      console.log('User lookup result:', { users, error });
      
      if (!error && users && users.length > 0) {
        console.log('Setting chatContactId:', users[0].id);
        sessionStorage.setItem('chatContactId', users[0].id);
      } else {
        console.error('Failed to find user with name:', senderName);
      }
      
      onNavigateToChat();
      setIsOpen(false);
    } else if (ticketId && onTicketClick) {
      // Ticket-related notification: navigate to ticket details
      onTicketClick(ticketId);
      setIsOpen(false);
    } else {
      // Admin announcement: show details dialog
      setSelectedNotification(notification);
      setIsDetailsDialogOpen(true);
      setIsOpen(false);
    }
  };
  
  // Truncate message for preview
  const truncateMessage = (message: string, maxLength: number = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const getIcon = (type: 'info' | 'warning' | 'success' | 'error') => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Info size={16} className="text-blue-600" />;
    }
  };

  return (
    <>
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-['Josefin_Sans',sans-serif] text-gray-900">Notifications</p>
            <p className="text-xs text-gray-500 font-['Abel',sans-serif]">{unreadCount} unread</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className="px-4 py-3 cursor-pointer focus:bg-gray-50"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3 w-full">
                  <div className="mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm font-['Abel',sans-serif] ${notification.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </p>
                      {notification.unread && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-['Abel',sans-serif] mb-1">
                      {truncateMessage(notification.message)}
                    </p>
                    <p className="text-xs text-gray-400 font-['Abel',sans-serif]">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          {userRole === 'admin' && (
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-[#8B0000] hover:text-[#6B0000] hover:bg-red-50"
                onClick={onViewAll}
              >
                View All Notifications
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Details Dialog for Admin Announcements */}
      <NotificationDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        notification={selectedNotification}
      />
    </>
  );
}