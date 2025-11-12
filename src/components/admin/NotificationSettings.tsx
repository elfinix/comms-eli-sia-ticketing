import { useState } from 'react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Bell, Mail } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface NotificationSettingsProps {
  onSave?: (settings: any) => void;
}

export default function NotificationSettings({ onSave }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    email_notifications: true,
    ticket_assigned: true,
    ticket_resolved: true,
    new_message: true,
    system_alerts: true,
    digest_frequency: 'daily',
  });

  const handleSave = () => {
    toast.success('Notification settings updated!');
    onSave?.(settings);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-[#8B0000]" size={24} />
        <div>
          <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
            Notification Settings
          </h3>
          <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
            Configure system-wide notification alert rules
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Email Notifications Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="text-gray-600" size={20} />
            <div>
              <p className="font-['Abel',sans-serif] text-sm text-gray-900 mb-1">
                Email Notifications
              </p>
              <p className="text-xs text-gray-500">
                Enable email notifications for all users
              </p>
            </div>
          </div>
          <Switch
            checked={settings.email_notifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, email_notifications: checked })
            }
          />
        </div>

        {/* Individual Notification Settings */}
        {settings.email_notifications && (
          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
            <div className="flex items-center justify-between">
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

            <div className="flex items-center justify-between">
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

            <div className="flex items-center justify-between">
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

            <div className="flex items-center justify-between">
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

            <div className="space-y-2">
              <Label className="font-['Abel',sans-serif] text-sm text-gray-900">
                Digest Frequency
              </Label>
              <Select
                value={settings.digest_frequency}
                onValueChange={(value) =>
                  setSettings({ ...settings, digest_frequency: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                How often users receive notification digests
              </p>
            </div>
          </div>
        )}

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
