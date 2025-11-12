import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Bell, 
  Mail, 
  CheckCircle,
  AlertCircle,
  Info,
  Send,
  Users,
  Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { getTimeAgo } from '../../data/notificationsData';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationGroup {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  recipients: string;
  recipientCount: number;
  status: 'sent';
  createdAt: string;
  sentAt: string;
}

export default function NotificationCenter() {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    recipients: 'all',
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      // Fetch all notifications, grouping by title, message, and type
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at, user_id')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
        setLoading(false);
        return;
      }
      
      // Group notifications by title, message, and type
      const groupedMap = new Map<string, NotificationGroup>();
      
      for (const notif of data || []) {
        const key = `${notif.title}-${notif.message}-${notif.type}`;
        
        if (groupedMap.has(key)) {
          const existing = groupedMap.get(key)!;
          existing.recipientCount += 1;
        } else {
          // Determine recipient label based on user roles (we'll just show count for now)
          groupedMap.set(key, {
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type as 'info' | 'warning' | 'success' | 'error',
            recipients: 'Users', // We'll update this
            recipientCount: 1,
            status: 'sent',
            createdAt: notif.created_at,
            sentAt: notif.created_at,
          });
        }
      }
      
      // Convert map to array and sort by date
      const grouped = Array.from(groupedMap.values()).sort((a, b) => 
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      );
      
      // Update recipient labels to show count
      grouped.forEach(g => {
        g.recipients = `${g.recipientCount} User${g.recipientCount > 1 ? 's' : ''}`;
      });
      
      setNotifications(grouped);
      setLoading(false);
    };

    fetchNotifications();
    
    // Set up realtime subscription for notifications
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendNotification = async () => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Fetch users based on recipients filter, excluding the current admin
    let roleFilter: string[] = [];
    if (formData.recipients === 'all') {
      roleFilter = ['student', 'faculty', 'ict'];
    } else if (formData.recipients === 'students') {
      roleFilter = ['student'];
    } else if (formData.recipients === 'faculty') {
      roleFilter = ['faculty'];
    } else if (formData.recipients === 'ict') {
      roleFilter = ['ict'];
    }
    
    console.log('Notification recipients filter:', formData.recipients, 'roleFilter:', roleFilter);
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('role', roleFilter)
      .neq('id', currentUser?.id); // Exclude the current admin
    
    console.log('Fetched users for notification:', users, 'Error:', usersError);
    
    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      toast.error('Failed to send notifications');
      return;
    }
    
    if (users.length === 0) {
      toast.error('No users found matching the selected recipients');
      return;
    }
    
    // Create notification for each user
    const notificationsToInsert = users.map(user => ({
      user_id: user.id,
      title: formData.title,
      message: formData.message,
      type: formData.type,
      is_read: false,
    }));
    
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert);
    
    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      toast.error('Failed to send notifications');
      return;
    }
    
    const newNotification: NotificationGroup = {
      id: notifications.length + 1,
      title: formData.title,
      message: formData.message,
      type: formData.type,
      recipients: formData.recipients === 'all' ? 'All Users' : formData.recipients,
      recipientCount: users.length,
      status: 'sent',
      createdAt: timestamp,
      sentAt: timestamp,
    };
    
    setNotifications([newNotification, ...notifications]);
    setIsCreateDialogOpen(false);
    resetForm();
    toast.success(`Notification sent to ${users.length} user(s)!`);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      recipients: 'all',
    });
  };

  const handleClearNotifications = async () => {
    // Delete all notifications from the database
    const { error } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)
    
    if (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
      return;
    }
    
    setNotifications([]);
    setIsClearDialogOpen(false);
    toast.success('All notifications cleared successfully!');
  };

  const typeIcons = {
    info: Info,
    warning: AlertCircle,
    success: CheckCircle,
    error: AlertCircle,
  };

  const typeColors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusColors = {
    sent: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
            Notification Center
          </h2>
          <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
            Manage system-wide notifications and alerts
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#8B0000] hover:bg-[#6B0000] text-white gap-2"
        >
          <Send size={18} />
          Create Notification
        </Button>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="text-[#8B0000]" size={24} />
            <div>
              <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                Recent Notifications
              </h3>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                Showing {Math.min(10, notifications.length)} most recent notifications
              </p>
            </div>
          </div>
          {notifications.length > 0 && (
            <Button 
              onClick={() => setIsClearDialogOpen(true)}
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              Clear All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-['Abel',sans-serif]">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-['Abel',sans-serif] mb-2">No notifications sent yet</p>
            <p className="text-sm text-gray-400 font-['Abel',sans-serif]">
              Create your first notification to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.slice(0, 10).map((notification) => {
              const TypeIcon = typeIcons[notification.type];
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 border border-gray-200 rounded-lg hover:border-[#8B0000]/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${typeColors[notification.type].split(' ')[0]}`}>
                        <TypeIcon size={20} className={typeColors[notification.type].split(' ')[1]} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-['Josefin_Sans',sans-serif] text-gray-900">
                            {notification.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-['Abel',sans-serif] ${statusColors[notification.status]}`}>
                            {notification.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 font-['Abel',sans-serif] mb-3">
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span className="font-['Abel',sans-serif]">{notification.recipients}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span className="font-['Abel',sans-serif]">
                              {notification.status === 'sent' ? `Sent ${getTimeAgo(notification.sentAt)}` : `Created ${getTimeAgo(notification.createdAt)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Send className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-['Abel',sans-serif]">Total Sent</p>
              <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">
                {notifications.filter(n => n.status === 'sent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-['Abel',sans-serif]">Scheduled</p>
              <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">
                {notifications.filter(n => n.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Mail className="text-gray-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-['Abel',sans-serif]">Drafts</p>
              <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">
                {notifications.filter(n => n.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif]">Create Notification</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif]">
              Send a system-wide notification to users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title" className="font-['Abel',sans-serif]">Notification Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="System Maintenance Scheduled"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="message" className="font-['Abel',sans-serif]">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter the notification message..."
                className="mt-2 min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" className="font-['Abel',sans-serif]">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="recipients" className="font-['Abel',sans-serif]">Recipients</Label>
                <Select 
                  value={formData.recipients} 
                  onValueChange={(value) => setFormData({ ...formData, recipients: value })}
                >
                  <SelectTrigger id="recipients" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="faculty">Faculty Only</SelectItem>
                    <SelectItem value="ict">ICT Staff Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendNotification}
              className="bg-[#8B0000] hover:bg-[#6B0000] gap-2"
            >
              <Send size={16} />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Notifications Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif] text-red-600">Clear All Notifications</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif]">
              This action will permanently delete all notifications from the system. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="text-red-600" size={24} />
              <div>
                <p className="font-['Abel',sans-serif] text-sm text-red-800">
                  <strong>{notifications.length}</strong> notification group(s) will be cleared
                </p>
                <p className="font-['Abel',sans-serif] text-xs text-red-600 mt-1">
                  This will affect all users who received these notifications
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleClearNotifications}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}