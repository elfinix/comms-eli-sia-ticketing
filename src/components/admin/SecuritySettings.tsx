import { useState } from 'react';
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
import { Lock, Key, Eye, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface SecuritySettingsProps {
  onSave?: (settings: any) => void;
}

export default function SecuritySettings({ onSave }: SecuritySettingsProps) {
  const [settings, setSettings] = useState({
    session_timeout: '30',
    password_expiry: '90',
    max_login_attempts: '5',
    two_factor_auth: false,
    data_encryption: true,
    audit_logging: true,
    access_logs_retention: '90',
  });

  const handleSave = () => {
    toast.success('Security settings updated!');
    onSave?.(settings);
  };

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
              />
              <p className="text-xs text-gray-500">
                Automatically log out inactive users
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
              />
              <p className="text-xs text-gray-500">
                Lock account after failed attempts
              </p>
            </div>
          </div>
        </div>

        {/* Password Policies */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Key className="text-gray-600" size={18} />
            <h4 className="font-['Abel',sans-serif] text-sm text-gray-900">
              Password Policies
            </h4>
          </div>
          <div className="pl-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password-expiry" className="font-['Abel',sans-serif]">
                Password Expiry (days)
              </Label>
              <Select
                value={settings.password_expiry}
                onValueChange={(value) =>
                  setSettings({ ...settings, password_expiry: value })
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
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Force users to change passwords periodically
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-['Abel',sans-serif] text-sm text-gray-900 mb-1">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-gray-500">
                  Require 2FA for all user accounts
                </p>
              </div>
              <Switch
                checked={settings.two_factor_auth}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, two_factor_auth: checked })
                }
              />
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
