export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  recipients: string;
  status: 'sent' | 'scheduled' | 'draft';
  createdAt: string;
  sentAt?: string;
  unread?: boolean;
}

// Shared notifications data
export const notificationsData: Notification[] = [
  {
    id: 1,
    title: 'System Maintenance Scheduled',
    message: 'LMS will be under maintenance on Jan 15, 2025 from 2:00 AM - 4:00 AM',
    type: 'warning',
    recipients: 'All Users',
    status: 'sent',
    createdAt: '2025-01-10 14:00:00',
    sentAt: '2025-01-10 14:00:00',
    unread: true,
  },
  {
    id: 2,
    title: 'New WiFi Access Points Installed',
    message: 'New WiFi access points have been installed in Building A for improved connectivity.',
    type: 'success',
    recipients: 'Students, Faculty',
    status: 'sent',
    createdAt: '2025-01-09 10:00:00',
    sentAt: '2025-01-09 10:00:00',
    unread: true,
  },
  {
    id: 3,
    title: 'Ticket Response Time Improved',
    message: 'Average response time has improved to 2 hours. Thank you for your patience!',
    type: 'info',
    recipients: 'All Users',
    status: 'sent',
    createdAt: '2025-01-08 16:00:00',
    sentAt: '2025-01-08 16:00:00',
    unread: false,
  },
  {
    id: 4,
    title: 'Security Update Required',
    message: 'Please update your password for enhanced security.',
    type: 'error',
    recipients: 'All Users',
    status: 'sent',
    createdAt: '2025-01-07 09:00:00',
    sentAt: '2025-01-07 09:00:00',
    unread: false,
  },
  {
    id: 5,
    title: 'System Upgrade Complete',
    message: 'Our ticketing system has been upgraded with new features!',
    type: 'success',
    recipients: 'All Users',
    status: 'sent',
    createdAt: '2025-01-05 11:00:00',
    sentAt: '2025-01-05 11:00:00',
    unread: false,
  },
];

// Function to get time ago string
export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}
