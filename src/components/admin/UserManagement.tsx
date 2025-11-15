import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useAuth } from '../../contexts/AuthContext';
import { User, UserRole } from '../../lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  MoreVertical,
  Mail,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

const roleBadgeColors = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  ict: 'bg-blue-100 text-blue-800 border-blue-200',
  faculty: 'bg-green-100 text-green-800 border-green-200',
  student: 'bg-orange-100 text-orange-800 border-orange-200',
};

const departments = [
  'General',
  'ICT - Hardware',
  'ICT - Software',
  'ICT - Network',
  'ICT - Account',
];

export default function UserManagement() {
  const { supabaseUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    userId: string | null;
    userName: string | null;
  }>({
    open: false,
    userId: null,
    userName: null,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student' as 'student' | 'faculty' | 'ict' | 'admin',
    department: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data as User[]);
      }
    };
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!supabaseUser) {
      toast.error('Authentication required');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get authentication session. Please try logging in again.');
      }
      
      const token = sessionData.session.access_token;
      console.log('Making request with token:', token ? 'Token exists' : 'No token');
      console.log('Token preview (first 20 chars):', token?.substring(0, 20) + '...');
      console.log('User ID from session:', sessionData.session.user.id);
      console.log('Request URL:', `https://${projectId}.supabase.co/functions/v1/make-server-0488e420/users`);
      console.log('Request payload:', JSON.stringify({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department || null,
      }));
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0488e420/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department || null,
        }),
      });

      const data = await response.json();
      console.log('Server response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      console.log('User created:', data);
      
      // Add user to local state
      setUsers([...users, data.user]);
      setIsAddDialogOpen(false);
      resetForm();
      
      toast.success(`User added successfully! Password: ${data.generatedPassword}`);
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!supabaseUser) {
      toast.error('Authentication required');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await supabase.auth.getSession().then(({ data }) => data.session?.access_token);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0488e420/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department || null,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      console.log('User updated:', data);
      
      // Update user in local state
      setUsers(users.map(u => u.id === selectedUser.id ? data.user : u));
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      
      toast.success('User updated successfully!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmDialog.userId || !supabaseUser) return;

    try {
      const token = await supabase.auth.getSession().then(({ data }) => data.session?.access_token);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0488e420/users/${deleteConfirmDialog.userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      console.log('User deleted:', data);
      
      // Remove user from local state
      setUsers(users.filter(u => u.id !== deleteConfirmDialog.userId));
      
      toast.success('User deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeleteConfirmDialog({ open: false, userId: null, userName: null });
    }
  };

  const handleToggleStatus = async (userId: string) => {
    if (!supabaseUser) {
      toast.error('Authentication required');
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    try {
      const token = await supabase.auth.getSession().then(({ data }) => data.session?.access_token);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0488e420/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      console.log('User status updated:', data);
      
      // Update user in local state
      setUsers(users.map(u => u.id === userId ? data.user : u));
      
      toast.success('User status updated!');
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error(error.message || 'Failed to update user status');
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      status: user.status,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'student',
      department: '',
      status: 'active',
    });
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    admin: users.filter(u => u.role === 'admin').length,
    ict: users.filter(u => u.role === 'ict').length,
    faculty: users.filter(u => u.role === 'faculty').length,
    student: users.filter(u => u.role === 'student').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Total Users</p>
          <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">{stats.total}</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Active</p>
          <p className="font-['Josefin_Sans',sans-serif] text-2xl text-green-600">{stats.active}</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">ICT Staff</p>
          <p className="font-['Josefin_Sans',sans-serif] text-2xl text-blue-600">{stats.ict}</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Faculty</p>
          <p className="font-['Josefin_Sans',sans-serif] text-2xl text-green-600">{stats.faculty}</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900 mb-1">
                User Management
              </h2>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                Manage user accounts and permissions
              </p>
            </div>
            <Button 
              onClick={() => {
                resetForm(); // Reset form to blank values
                setIsAddDialogOpen(true);
              }}
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white gap-2"
            >
              <UserPlus size={18} />
              Add User
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="ict">ICT Staff</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-['Abel',sans-serif] text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-full flex items-center justify-center text-white text-sm mr-3">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-['Abel',sans-serif] text-sm text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-['Abel',sans-serif] border ${roleBadgeColors[user.role]}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 size={14} />
                      <span className="font-['Abel',sans-serif]">{user.department}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.status === 'active' ? (
                        <>
                          <CheckCircle size={16} className="text-green-600" />
                          <span className="text-sm text-green-600 font-['Abel',sans-serif]">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-400 font-['Abel',sans-serif]">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id)}
                        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                        title="Toggle Status"
                      >
                        <Shield size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmDialog({ open: true, userId: user.id, userName: user.name })}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-red-600"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-['Abel',sans-serif]">No users found</p>
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif]">Add New User</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif]">
              Create a new user account for the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="font-['Abel',sans-serif]">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div>
              <Label htmlFor="email" className="font-['Abel',sans-serif]">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan.delacruz@lyceum-cavite.edu.ph"
              />
            </div>
            
            {/* Password Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="text-blue-600 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-xs font-['Abel',sans-serif] text-blue-900 mb-1">
                    <strong>Password Format:</strong>
                  </p>
                  <p className="text-xs font-['Abel',sans-serif] text-blue-800">
                    Auto-generated as: <code className="bg-blue-100 px-1.5 py-0.5 rounded">emailPrefix_role</code>
                  </p>
                  <p className="text-xs font-['Abel',sans-serif] text-blue-700 mt-1">
                    Example: <code className="bg-blue-100 px-1.5 py-0.5 rounded">juan.delacruz_student</code>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="role" className="font-['Abel',sans-serif]">Role</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value, department: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="ict">ICT Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department" className="font-['Abel',sans-serif]">Department</Label>
              {formData.role === 'ict' ? (
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ICT Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="College of Computer Studies"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              className="bg-[#8B0000] hover:bg-[#6B0000]"
              type="button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif]">Edit User</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif]">
              Update user account information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name" className="font-['Abel',sans-serif]">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="font-['Abel',sans-serif]">
                Email Address <span className="text-gray-400 text-xs">(Cannot be changed)</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="edit-role" className="font-['Abel',sans-serif]">Role</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value, department: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="ict">ICT Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-department" className="font-['Abel',sans-serif]">Department</Label>
              {formData.role === 'ict' ? (
                <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ICT Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser}
              className="bg-[#8B0000] hover:bg-[#6B0000]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => setDeleteConfirmDialog({ open, userId: null, userName: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif] text-red-600">Delete User</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif]">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirmDialog.userName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialog({ open: false, userId: null, userName: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteUser}
              className="bg-[#8B0000] hover:bg-[#6B0000]"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}