import { useState, useEffect } from 'react';
import { User, Mail, Building2, Calendar, Shield, Edit2, Save, X, Eye, EyeOff, GraduationCap, Wrench, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabaseClient';

interface ProfilePageProps {
  userName: string;
  userEmail: string;
  userRole: 'student' | 'faculty' | 'ict' | 'admin';
  userId: string;
}

interface ActivityLog {
  id: string;
  action: string;
  created_at: string;
  metadata?: {
    ip?: string;
    device?: string;
  };
}

export default function ProfilePage({ userName, userEmail, userRole, userId }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [userCreatedAt, setUserCreatedAt] = useState<string>('');
  const [lastLogin, setLastLogin] = useState<string>('');
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileData, setProfileData] = useState({
    name: userName,
    email: userEmail,
    department: '',
  });

  const [originalProfileData, setOriginalProfileData] = useState({
    name: userName,
    email: userEmail,
    department: '',
  });

  // Static bio based on user role
  const getStaticBio = () => {
    const bios = {
      student: 'Student at Lyceum of the Philippines University – Cavite. Using the IT Helpdesk System to report and track technical issues.',
      faculty: 'Faculty member at Lyceum of the Philippines University – Cavite. Reporting academic technology issues through the IT Helpdesk System.',
      ict: 'ICT Staff at Lyceum of the Philippines University – Cavite. Dedicated to resolving technical issues and providing support to students and faculty.',
      admin: 'System Administrator at Lyceum of the Philippines University – Cavite. Managing the IT Helpdesk System and overseeing technical support operations.',
    };
    return bios[userRole];
  };

  // Fetch user profile data from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, department, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else if (data) {
        const userData = {
          name: data.name || userName,
          email: data.email || userEmail,
          department: data.department || '',
        };
        setProfileData(userData);
        setOriginalProfileData(userData);
        
        // Set user created date
        if (data.created_at) {
          const createdDate = new Date(data.created_at);
          setUserCreatedAt(createdDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          }));
        }
      }
    };

    fetchUserProfile();
  }, [userId, userName, userEmail]);

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    setIsLoadingActivity(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching activity logs:', error);
        toast.error('Failed to load activity logs');
      } else if (data) {
        setActivityLogs(data);
        
        // Set last login from most recent login activity
        const lastLoginLog = data.find(log => log.action === 'Logged in');
        if (lastLoginLog) {
          const loginDate = new Date(lastLoginLog.created_at);
          setLastLogin(loginDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }) + ' at ' + loginDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }));
        }
      }
    } catch (err) {
      console.error('Error in fetchActivityLogs:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update user profile in database
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          email: profileData.email,
          department: profileData.department,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
      } else {
        // Log the activity
        await supabase.from('activity_logs').insert({
          user_id: userId,
          action: 'Profile updated',
          metadata: {}
        });

        setOriginalProfileData(profileData);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error in handleSave:', err);
      toast.error('An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData(originalProfileData);
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Error changing password:', error);
        toast.error('Failed to change password');
      } else {
        // Log the activity
        await supabase.from('activity_logs').insert({
          user_id: userId,
          action: 'Password changed',
          metadata: {}
        });

        toast.success('Password changed successfully!');
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error('Error in handleChangePassword:', err);
      toast.error('An error occurred while changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleOpenActivityDialog = () => {
    setShowActivityDialog(true);
    fetchActivityLogs();
  };

  const formatActivityTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) + ' at ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getRoleBadge = () => {
    const roleConfig = {
      student: { label: 'Student', color: 'bg-blue-100 text-blue-800' },
      faculty: { label: 'Faculty', color: 'bg-purple-100 text-purple-800' },
      ict: { label: 'ICT Staff', color: 'bg-green-100 text-green-800' },
      admin: { label: 'Administrator', color: 'bg-red-100 text-red-800' },
    };
    const config = roleConfig[userRole];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-['Abel',sans-serif] ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
            My Profile
          </h2>
          <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
            Manage your personal information
          </p>
        </div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white gap-2"
          >
            <Edit2 size={18} />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="gap-2"
              disabled={isSaving}
            >
              <X size={18} />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white gap-2"
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Profile Info */}
        <div className="px-6 py-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-shrink-0"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
                {userRole === 'student' && <GraduationCap size={48} className="text-gray-600" />}
                {userRole === 'faculty' && <User size={48} className="text-gray-600" />}
                {userRole === 'ict' && <Wrench size={48} className="text-gray-600" />}
                {userRole === 'admin' && <Settings size={48} className="text-gray-600" />}
              </div>
            </motion.div>

            {/* Name and Role */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">
                  {profileData.name}
                </h1>
                {getRoleBadge()}
              </div>
              <p className="text-gray-600 font-['Abel',sans-serif] mb-4">
                {profileData.email}
              </p>
              <p className="text-gray-600 font-['Abel',sans-serif] max-w-2xl">
                {getStaticBio()}
              </p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label className="font-['Abel',sans-serif] text-gray-500 flex items-center gap-2 mb-2">
                  <User size={16} />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="font-['Abel',sans-serif]"
                  />
                ) : (
                  <p className="font-['Abel',sans-serif] text-gray-900">{profileData.name}</p>
                )}
              </div>

              <div>
                <Label className="font-['Abel',sans-serif] text-gray-500 flex items-center gap-2 mb-2">
                  <Mail size={16} />
                  Email Address
                </Label>
                {isEditing ? (
                  <Input
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    type="email"
                    className="font-['Abel',sans-serif]"
                  />
                ) : (
                  <p className="font-['Abel',sans-serif] text-gray-900">{profileData.email}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label className="font-['Abel',sans-serif] text-gray-500 flex items-center gap-2 mb-2">
                  <Building2 size={16} />
                  Department
                </Label>
                {isEditing ? (
                  <Input
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    className="font-['Abel',sans-serif]"
                    placeholder="Enter your department"
                  />
                ) : (
                  <p className="font-['Abel',sans-serif] text-gray-900">
                    {profileData.department || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label className="font-['Abel',sans-serif] text-gray-500 flex items-center gap-2 mb-2">
                  <Calendar size={16} />
                  Member Since
                </Label>
                <p className="font-['Abel',sans-serif] text-gray-900">
                  {userCreatedAt || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Security */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                Account Security
              </h3>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                Manage your password and security settings
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowPasswordDialog(true)}
            variant="outline"
            className="w-full"
          >
            Change Password
          </Button>
        </div>

        {/* Account Activity */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                Account Activity
              </h3>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                {lastLogin ? `Last login: ${lastLogin}` : 'View your recent activity'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleOpenActivityDialog}
            variant="outline"
            className="w-full"
          >
            View Activity Log
          </Button>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and new password to update your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-['Abel',sans-serif] text-gray-500 flex items-center gap-2 mb-2">
                <Shield size={16} />
                Current Password
              </Label>
              <div className="relative">
                <Input
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="font-['Abel',sans-serif] pr-10"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-['Abel',sans-serif] text-gray-500 flex items-center gap-2 mb-2">
                <Shield size={16} />
                New Password
              </Label>
              <div className="relative">
                <Input
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  type={showNewPassword ? 'text' : 'password'}
                  className="font-['Abel',sans-serif] pr-10"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-['Abel',sans-serif] text-gray-500 flex items-center gap-2 mb-2">
                <Shield size={16} />
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="font-['Abel',sans-serif] pr-10"
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              variant="outline"
              className="mr-2"
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Account Activity</DialogTitle>
            <DialogDescription>
              View your recent account activities.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
            {isLoadingActivity ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-['Abel',sans-serif]">Loading activity logs...</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-['Abel',sans-serif]">No activity logs found</p>
              </div>
            ) : (
              activityLogs.map(log => (
                <div key={log.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="text-gray-600" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Abel',sans-serif] text-gray-900 mb-1">{log.action}</p>
                      <p className="text-xs text-gray-500 font-['Abel',sans-serif]">
                        {formatActivityTimestamp(log.created_at)}
                      </p>
                      {log.metadata && (log.metadata.ip || log.metadata.device) && (
                        <p className="text-xs text-gray-400 font-['Abel',sans-serif] mt-1">
                          {log.metadata.ip && `${log.metadata.ip}`}
                          {log.metadata.ip && log.metadata.device && ' • '}
                          {log.metadata.device && `${log.metadata.device}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex justify-end border-t border-gray-200 pt-4">
            <Button
              onClick={() => setShowActivityDialog(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}