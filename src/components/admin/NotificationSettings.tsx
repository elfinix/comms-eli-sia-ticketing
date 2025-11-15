import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Bell } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationSettingsProps {
  onSave?: (settings: any) => void;
}

export default function NotificationSettings({ onSave }: NotificationSettingsProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    ticket_assigned: true,
    ticket_resolved: true,
    new_message: true,
    system_alerts: true,
  });

  // Load settings from database on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['ticket_assigned', 'ticket_resolved', 'new_message', 'system_alerts']);

    if (error) {
      console.error('Error loading notification settings:', error);
    } else if (data && data.length > 0) {
      const settingsObj: any = {};
      data.forEach(item => {
        settingsObj[item.key] = item.value === 'true';
      });
      setSettings({ ...settings, ...settingsObj });
    } else {
      // Create default settings if none exist
      await supabase.from('system_settings').insert([
        { 
          key: 'ticket_assigned', 
          value: 'true',
          description: 'Notify users when a ticket is assigned',
          updated_by: currentUser?.id
        },
        { 
          key: 'ticket_resolved', 
          value: 'true',
          description: 'Notify users when their ticket is resolved',
          updated_by: currentUser?.id
        },
        { 
          key: 'new_message', 
          value: 'true',
          description: 'Notify users when they receive new chat messages',
          updated_by: currentUser?.id
        },
        { 
          key: 'system_alerts', 
          value: 'true',
          description: 'Critical system alerts and announcements',
          updated_by: currentUser?.id
        }
      ]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    // Update each setting individually in the database
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      updates.push(
        supabase
          .from('system_settings')
          .update({ 
            value: String(value),
            updated_at: new Date().toISOString(),
            updated_by: currentUser?.id
          })
          .eq('key', key)
      );
    }

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      console.error('Error updating notification settings');
      toast.error('Failed to update notification settings');
      return;
    }

    toast.success('Notification settings updated successfully!');
    onSave?.(settings);

    // Log the change
    await supabase.from('activity_logs').insert({
      action: 'Updated notification settings',
      user_id: currentUser?.id || null,
      ip_address: null,
      device: navigator.userAgent
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <p className="text-gray-500 font-['Abel',sans-serif]">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-[#8B0000]" size={24} />
        <div>
          <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
            Notification Settings
          </h3>
          <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
            Configure system-wide in-app notification preferences
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="font-['Abel',sans-serif] text-sm text-gray-900">
              Ticket Assigned
            </Label>
            <p className="text-xs text-gray-500">
              Notify users when a ticket is assigned to them
            </p>
          </div>
          <Switch
            checked={settings.ticket_assigned}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, ticket_assigned: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="font-['Abel',sans-serif] text-sm text-gray-900">
              Ticket Resolved
            </Label>
            <p className="text-xs text-gray-500">
              Notify users when their ticket is resolved
            </p>
          </div>
          <Switch
            checked={settings.ticket_resolved}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, ticket_resolved: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="font-['Abel',sans-serif] text-sm text-gray-900">
              New Messages
            </Label>
            <p className="text-xs text-gray-500">
              Notify users when they receive new chat messages
            </p>
          </div>
          <Switch
            checked={settings.new_message}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, new_message: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="font-['Abel',sans-serif] text-sm text-gray-900">
              System Alerts
            </Label>
            <p className="text-xs text-gray-500">
              Critical system alerts and announcements
            </p>
          </div>
          <Switch
            checked={settings.system_alerts}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, system_alerts: checked })
            }
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            className="bg-[#8B0000] hover:bg-[#6B0000]"
          >
            Save Notification Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
