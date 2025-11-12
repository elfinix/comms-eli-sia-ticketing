import { useState } from 'react';
import { Bell, Shield, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface SettingsPageProps {
  userRole: 'student' | 'faculty' | 'ict' | 'admin';
}

export default function SettingsPage({ userRole }: SettingsPageProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    ticketUpdates: true,
    newMessages: true,
  });

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  const handleExportData = async () => {
    try {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      // Fetch all user data
      const [
        { data: userData },
        { data: ticketsData },
        { data: messagesData },
        { data: notificationsData },
        { data: activityLogsData }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('tickets').select('*').eq('submitted_by', user.id),
        supabase.from('chat_messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from('notifications').select('*').eq('user_id', user.id),
        supabase.from('activity_logs').select('*').eq('user_id', user.id)
      ]);

      // Prepare export data
      const exportData = {
        exportDate: new Date().toISOString(),
        user: userData,
        tickets: ticketsData || [],
        messages: messagesData || [],
        notifications: notificationsData || [],
        activityLogs: activityLogsData || []
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lpu-helpdesk-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Your data has been exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
          Settings
        </h2>
        <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
          Manage your account preferences and notifications
        </p>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bell className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
              Notifications
            </h3>
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
              Configure how you receive notifications
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <Label className="font-['Abel',sans-serif] text-gray-900">Email Notifications</Label>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <Label className="font-['Abel',sans-serif] text-gray-900">Push Notifications</Label>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                Receive push notifications in browser
              </p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pushNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <Label className="font-['Abel',sans-serif] text-gray-900">Ticket Updates</Label>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                Get notified when your tickets are updated
              </p>
            </div>
            <Switch
              checked={settings.ticketUpdates}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, ticketUpdates: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label className="font-['Abel',sans-serif] text-gray-900">New Messages</Label>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                Get notified when you receive new messages
              </p>
            </div>
            <Switch
              checked={settings.newMessages}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, newMessages: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="text-green-600" size={20} />
          </div>
          <div>
            <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
              Privacy & Security
            </h3>
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
              Manage your data and security settings
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleExportData}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Download size={18} />
            Export My Data
          </Button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}