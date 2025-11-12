import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { getTimeAgo } from '../data/notificationsData';

interface NotificationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: {
    id: number;
    title: string;
    message: string;
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'error';
  } | null;
}

export default function NotificationDetailsDialog({
  open,
  onOpenChange,
  notification,
}: NotificationDetailsDialogProps) {
  if (!notification) return null;

  const getIcon = (type: 'info' | 'warning' | 'success' | 'error') => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className="text-green-600" />;
      case 'warning':
        return <AlertCircle size={24} className="text-yellow-600" />;
      case 'error':
        return <AlertCircle size={24} className="text-red-600" />;
      default:
        return <Info size={24} className="text-blue-600" />;
    }
  };

  const getBackgroundColor = (type: 'info' | 'warning' | 'success' | 'error') => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-['Josefin_Sans',sans-serif] text-xl flex items-center gap-3">
            {getIcon(notification.type)}
            {notification.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timestamp */}
          <div className="flex items-center justify-between text-sm text-gray-500 font-['Abel',sans-serif] pb-3 border-b border-gray-200">
            <span>{getTimeAgo(notification.timestamp)}</span>
            <span>{new Date(notification.timestamp).toLocaleString()}</span>
          </div>

          {/* Message */}
          <div className={`p-4 rounded-lg border ${getBackgroundColor(notification.type)}`}>
            <p className="text-gray-800 font-['Abel',sans-serif] leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Footer Info */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-['Abel',sans-serif] text-center">
              This is a system-wide announcement from the Administrator
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
