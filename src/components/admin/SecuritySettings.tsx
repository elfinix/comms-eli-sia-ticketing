import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Lock, Eye, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface SecuritySettingsProps {
  onSave?: (settings: any) => void;
}

export default function SecuritySettings({ onSave }: SecuritySettingsProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    session_timeout: '30',
    max_login_attempts: '5',
    data_encryption: true,
    audit_logging: true,
    access_logs_retention: '90',
  });

  // Load settings from database on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['session_timeout', 'max_login_attempts', 'data_encryption', 'audit_logging', 'access_logs_retention']);

    if (error) {
      console.error('Error loading security settings:', error);
    } else if (data && data.length > 0) {
      const settingsObj: any = {};
      data.forEach(item => {
        if (item.key === 'data_encryption' || item.key === 'audit_logging') {
          settingsObj[item.key] = item.value === 'true';
        } else {
          settingsObj[item.key] = item.value;
        }
      });
      setSettings({ ...settings, ...settingsObj });
    } else {
      // Create default settings if none exist
      await supabase.from('system_settings').insert([
        { 
          key: 'session_timeout', 
          value: '30',
          description: 'Session timeout in minutes',
          updated_by: currentUser?.id
        },
        { 
          key: 'max_login_attempts', 
          value: '5',
          description: 'Maximum login attempts before account lock',
          updated_by: currentUser?.id
        },
        { 
          key: 'data_encryption', 
          value: 'true',
          description: 'Enable data encryption at rest',
          updated_by: currentUser?.id
        },
        { 
          key: 'audit_logging', 
          value: 'true',
          description: 'Track all user actions and system events',
          updated_by: currentUser?.id
        },
        { 
          key: 'access_logs_retention', 
          value: '90',
          description: 'Access logs retention period in days',
          updated_by: currentUser?.id
        }
      ]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    // Validation
    const sessionTimeout = parseInt(settings.session_timeout);
    const maxLoginAttempts = parseInt(settings.max_login_attempts);

    if (isNaN(sessionTimeout) || sessionTimeout < 5 || sessionTimeout > 1440) {
      toast.error('Session timeout must be between 5 and 1440 minutes');
      return;
    }

    if (isNaN(maxLoginAttempts) || maxLoginAttempts < 3 || maxLoginAttempts > 10) {
      toast.error('Max login attempts must be between 3 and 10');
      return;
    }

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
      console.error('Error updating security settings');
      toast.error('Failed to update security settings');
      return;
    }

    toast.success('Security settings updated successfully!');
    onSave?.(settings);

    // Log the change
    await supabase.from('activity_logs').insert({
      action: 'Updated security settings',
      user_id: currentUser?.id || null,
      ip_address: null,
      device: navigator.userAgent
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <p className="text-gray-500 font-['Abel',sans-serif]">Loading security settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-[#8B0000]" size={24} />
        <div>
          <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
            Security & Privacy Settings
          </h3>
          <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
            Configure access control and data protection policies
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Session Management */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="text-gray-600" size={18} />
            <h4 className="font-['Abel',sans-serif] text-sm text-gray-900">
              Session Management
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label htmlFor="session-timeout" className="font-['Abel',sans-serif]">
                Session Timeout (minutes)
              </Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.session_timeout}
                onChange={(e) =>
                  setSettings({ ...settings, session_timeout: e.target.value })
                }
                placeholder="30"
                min="5"
                max="1440"
              />
              <p className="text-xs text-gray-500">
                Automatically log out inactive users (5-1440 minutes)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-login-attempts" className="font-['Abel',sans-serif]">
                Max Login Attempts
              </Label>
              <Input
                id="max-login-attempts"
                type="number"
                value={settings.max_login_attempts}
                onChange={(e) =>
                  setSettings({ ...settings, max_login_attempts: e.target.value })
                }
                placeholder="5"
                min="3"
                max="10"
              />
              <p className="text-xs text-gray-500">
                Lock account after failed attempts (3-10)
              </p>
            </div>
          </div>
        </div>

        {/* Data Protection */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="text-gray-600" size={18} />
            <h4 className="font-['Abel',sans-serif] text-sm text-gray-900">
              Data Protection
            </h4>
          </div>
          <div className="pl-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-['Abel',sans-serif] text-sm text-gray-900 mb-1">
                  Data Encryption
                </p>
                <p className="text-xs text-gray-500">
                  Encrypt sensitive data at rest
                </p>
              </div>
              <Switch
                checked={settings.data_encryption}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, data_encryption: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-['Abel',sans-serif] text-sm text-gray-900 mb-1">
                  Audit Logging
                </p>
                <p className="text-xs text-gray-500">
                  Track all user actions and system events
                </p>
              </div>
              <Switch
                checked={settings.audit_logging}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, audit_logging: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logs-retention" className="font-['Abel',sans-serif]">
                Access Logs Retention (days)
              </Label>
              <Select
                value={settings.access_logs_retention}
                onValueChange={(value) =>
                  setSettings({ ...settings, access_logs_retention: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                How long to keep access logs
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            className="bg-[#8B0000] hover:bg-[#6B0000]"
          >
            Save Security Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
