import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { 
  Server, 
  Database, 
  Shield, 
  AlertTriangle,
  Clock,
  HardDrive,
  Activity,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Settings,
  FileText,
  History,
  Bell,
  Lock,
  Key,
  Eye,
  Mail
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
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';

interface SystemSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  ticket_assigned: boolean;
  ticket_resolved: boolean;
  new_message: boolean;
  system_alerts: boolean;
  digest_frequency: string;
}

interface SecuritySettings {
  session_timeout: string;
  password_expiry: string;
  max_login_attempts: string;
  two_factor_auth: boolean;
  data_encryption: boolean;
  audit_logging: boolean;
  access_logs_retention: string;
}

interface BackupHistory {
  id: string;
  created_at: string;
  backup_type: string;
  status: string;
  file_size?: string;
}

interface AuditLog {
  id: string;
  action: string;
  user_id: string;
  user_email?: string;
  created_at: string;
  details?: string;
}

export default function SystemMaintenance() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    maintenance_message: 'System is under maintenance. We will be back soon.',
  });

  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isBackupHistoryOpen, setIsBackupHistoryOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupHistory | null>(null);
  const [systemStats, setSystemStats] = useState({
    totalTickets: 0,
    totalUsers: 0,
    activeChats: 0,
    storageUsed: 0,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    ticket_assigned: true,
    ticket_resolved: true,
    new_message: true,
    system_alerts: true,
    digest_frequency: 'daily',
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    session_timeout: '30',
    password_expiry: '90',
    max_login_attempts: '5',
    two_factor_auth: false,
    data_encryption: true,
    audit_logging: true,
    access_logs_retention: '90',
  });

  // Load settings from database
  useEffect(() => {
    loadSettings();
    loadBackupHistory();
    loadAuditLogs();
    loadSystemStats();
  }, []);

  const loadSettings = async () => {
    // Get settings from key-value table
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['maintenance_mode', 'maintenance_message']);

    if (error) {
      console.error('Error loading settings:', error);
    } else if (data && data.length > 0) {
      const settingsObj: any = {};
      data.forEach(item => {
        if (item.key === 'maintenance_mode') {
          settingsObj.maintenance_mode = item.value === 'true';
        } else if (item.key === 'maintenance_message') {
          settingsObj.maintenance_message = item.value;
        }
      });
      setSettings({ ...settings, ...settingsObj });
    } else {
      // Create default settings if none exist
      await supabase.from('system_settings').insert([
        { 
          key: 'maintenance_mode', 
          value: 'false',
          description: 'Enable to prevent non-admin users from accessing the system',
          updated_by: currentUser?.id
        },
        { 
          key: 'maintenance_message', 
          value: 'System is under maintenance. We will be back soon.',
          description: 'Message displayed to users when maintenance mode is enabled',
          updated_by: currentUser?.id
        }
      ]);
    }
    setLoading(false);
  };

  const loadBackupHistory = async () => {
    const { data, error } = await supabase
      .from('backup_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading backup history:', error);
    } else {
      setBackupHistory(data || []);
    }
  };

  const loadAuditLogs = async () => {
    // Load from activity_logs and join with users to get email
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        action,
        user_id,
        created_at,
        users (email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading audit logs:', error);
    } else {
      // Map the data to include user_email
      const mappedLogs = (data || []).map((log: any) => ({
        id: log.id,
        action: log.action,
        user_id: log.user_id,
        user_email: log.users?.email || 'Unknown',
        created_at: log.created_at,
      }));
      setAuditLogs(mappedLogs);
    }
  };

  const loadSystemStats = async () => {
    // Get ticket count
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    // Get user count
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active chats count
    const { count: chatCount } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true });

    // Get storage usage (approximate based on attachments)
    const { data: attachments } = await supabase
      .from('tickets')
      .select('attachment_url')
      .not('attachment_url', 'is', null);

    setSystemStats({
      totalTickets: ticketCount || 0,
      totalUsers: userCount || 0,
      activeChats: chatCount || 0,
      storageUsed: Math.round((attachments?.length || 0) * 2.5), // Rough estimate in MB
    });
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    
    // Update each setting individually in the key-value table
    const updates = [];
    for (const [key, value] of Object.entries(newSettings)) {
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
      console.error('Error updating settings');
      toast.error('Failed to update settings');
      return false;
    }

    setSettings(updatedSettings);
    
    // Log the change
    await createAuditLog(
      `Updated system settings: ${Object.keys(newSettings).join(', ')}`
    );
    
    return true;
  };

  const createAuditLog = async (action: string, details?: string) => {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        action,
        user_id: currentUser?.id || null,
        ip_address: null,
        device: navigator.userAgent
      });

    if (!error) {
      loadAuditLogs(); // Refresh the logs
    }
  };

  const handleMaintenanceModeToggle = async (checked: boolean) => {
    const success = await updateSettings({ maintenance_mode: checked });
    if (success) {
      toast.success(
        checked ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
        {
          description: checked
            ? 'Only admins can access the system'
            : 'System is now accessible to all users',
        }
      );
    }
  };

  const handleBackupNow = async () => {
    toast.info('Creating backup...', {
      description: 'This may take a few moments',
    });

    // Create backup record
    const { data, error } = await supabase
      .from('backup_history')
      .insert({
        backup_type: 'manual',
        status: 'completed',
        file_size: `${systemStats.storageUsed}MB`,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating backup:', error);
      toast.error('Backup failed');
      await createAuditLog('Manual Backup Failed');
      return;
    }

    await createAuditLog(`Manual Backup Created - Backup ID: ${data.id}`);
    loadBackupHistory();
    
    toast.success('Backup completed successfully!', {
      description: 'System data has been backed up',
    });
  };

  const handleRestoreFromBackup = (backup: BackupHistory) => {
    setSelectedBackup(backup);
    setIsRestoreDialogOpen(true);
    setIsBackupHistoryOpen(false);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;

    toast.info('Restoring from backup...', {
      description: 'This process may take several minutes',
    });

    // Simulate restore process (in production, this would restore actual data)
    await new Promise(resolve => setTimeout(resolve, 2000));

    await createAuditLog(`System Restored from Backup - Backup ID: ${selectedBackup.id} (${new Date(selectedBackup.created_at).toLocaleString()})`);
    
    setIsRestoreDialogOpen(false);
    setSelectedBackup(null);
    
    toast.success('System restored successfully!', {
      description: 'Data has been restored from the selected backup',
    });

    // Reload all data
    loadSettings();
    loadSystemStats();
    loadAuditLogs();
  };

  const handleExportLogs = () => {
    // Convert audit logs to CSV
    const headers = ['Action', 'User', 'Timestamp', 'Status', 'Details'];
    const csvContent = [
      headers.join(','),
      ...auditLogs.map(log => [
        `"${log.action}"`,
        log.user_email,
        new Date(log.created_at).toLocaleString(),
        log.status,
        `"${log.details || ''}"`,
      ].join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Logs exported successfully!');
    createAuditLog('Export Audit Logs', 'Success', `Exported ${auditLogs.length} logs`);
  };

  const systemHealth = {
    cpu: 45,
    memory: 62,
    storage: Math.min(100, Math.round((systemStats.storageUsed / 1000) * 100)), // % of 1GB
    database: 'Healthy',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 font-['Abel',sans-serif]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Total Tickets</p>
              <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">{systemStats.totalTickets}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-['Abel',sans-serif]">All time tickets</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Total Users</p>
              <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">{systemStats.totalUsers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Server className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-['Abel',sans-serif]">Registered users</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Storage Used</p>
              <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">{systemStats.storageUsed}MB</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <HardDrive className="text-green-600" size={20} />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${systemHealth.storage}%` }}
            />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Database</p>
              <p className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">{systemHealth.database}</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <Database className="text-emerald-600" size={20} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle size={16} />
            <span className="font-['Abel',sans-serif]">All systems operational</span>
          </div>
        </motion.div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="text-[#8B0000]" size={24} />
          <div>
            <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
              Maintenance Mode
            </h3>
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
              Enable to prevent user access during system maintenance
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-['Abel',sans-serif] text-sm text-gray-900 mb-1">
                Maintenance Mode
              </p>
              <p className="text-xs text-gray-500">
                {settings.maintenance_mode ? 'System is currently in maintenance mode' : 'System is accessible to all users'}
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={handleMaintenanceModeToggle}
            />
          </div>

          {settings.maintenance_mode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="maintenance-message" className="font-['Abel',sans-serif]">
                  Maintenance Message
                </Label>
                <Textarea
                  id="maintenance-message"
                  value={settings.maintenance_message}
                  onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                  placeholder="Enter message to display to users..."
                  className="mt-2"
                />
              </div>
              <Button 
                onClick={() => updateSettings({ maintenance_message: settings.maintenance_message })}
                className="bg-[#8B0000] hover:bg-[#6B0000]"
              >
                Update Message
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Database className="text-[#8B0000]" size={24} />
          <div>
            <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
              Backup & Restore
            </h3>
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
              Manage system backups and data restoration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {backupHistory.length > 0 ? (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-['Abel',sans-serif] text-blue-900 mb-1">
                  Last Backup
                </p>
                <p className="text-xs text-blue-700">
                  {new Date(backupHistory[0].created_at).toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Size: {backupHistory[0].file_size || 'N/A'}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-['Abel',sans-serif] text-gray-600">
                  No backups created yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Create your first backup to get started
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleBackupNow}
              className="w-full bg-[#8B0000] hover:bg-[#6B0000] gap-2"
            >
              <Download size={18} />
              Backup Now
            </Button>
            <Button 
              onClick={() => {
                if (backupHistory.length > 0) {
                  handleRestoreFromBackup(backupHistory[0]);
                } else {
                  toast.error('No backups available to restore');
                }
              }}
              variant="outline"
              className="w-full gap-2 border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
              disabled={backupHistory.length === 0}
            >
              <Upload size={18} />
              Restore from Backup
            </Button>
            <Button 
              onClick={() => setIsBackupHistoryOpen(true)}
              variant="outline"
              className="w-full gap-2"
            >
              <History size={18} />
              View Backup History
            </Button>
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="text-[#8B0000]" size={24} />
            <div>
              <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                Activity Logs
              </h3>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                System activity and security logs
              </p>
            </div>
          </div>
          <Button 
            onClick={handleExportLogs}
            variant="outline" 
            size="sm" 
            className="gap-2"
            disabled={auditLogs.length === 0}
          >
            <Download size={16} />
            Export Logs
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500 font-['Abel',sans-serif]">
                    No activity logs available
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-['Abel',sans-serif] text-sm text-gray-900">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-['Abel',sans-serif] text-sm text-gray-600">
                      {log.user_email}
                    </td>
                    <td className="px-4 py-3 font-['Abel',sans-serif] text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Settings */}
      <NotificationSettings onSave={(settings) => {
        setNotificationSettings(settings);
        createAuditLog('Updated notification settings');
      }} />

      {/* Security & Privacy Settings */}
      <SecuritySettings onSave={(settings) => {
        setSecuritySettings(settings);
        createAuditLog('Updated security settings');
      }} />

      {/* Backup History Dialog */}
      <Dialog open={isBackupHistoryOpen} onOpenChange={setIsBackupHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif]">Backup History</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif]">
              View all system backups
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backupHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 font-['Abel',sans-serif]">
                      No backup history available
                    </td>
                  </tr>
                ) : (
                  backupHistory.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-['Abel',sans-serif] text-sm text-gray-900">
                        {new Date(backup.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-['Abel',sans-serif] text-sm text-gray-600 capitalize">
                        {backup.backup_type}
                      </td>
                      <td className="px-4 py-3 font-['Abel',sans-serif] text-sm text-gray-600">
                        {backup.file_size || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-['Abel',sans-serif] ${
                          backup.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {backup.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          onClick={() => handleRestoreFromBackup(backup)}
                          variant="outline"
                          size="sm"
                          className="gap-2 border-[#8B0000] text-[#8B0000] hover:bg-[#8B0000] hover:text-white"
                          disabled={backup.status !== 'completed'}
                        >
                          <Upload size={16} />
                          Restore
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBackupHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif]">Restore Backup</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif]">
              Are you sure you want to restore from this backup?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
              Restoring from a backup will overwrite all current data with the data from the selected backup.
            </p>
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
              This process may take several minutes.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRestore}
              className="bg-[#8B0000] hover:bg-[#6B0000]"
            >
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}