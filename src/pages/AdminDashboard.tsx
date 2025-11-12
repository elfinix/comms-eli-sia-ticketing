import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import TicketCard from '../components/TicketCard';
import UserManagement from '../components/admin/UserManagement';
import AdminTickets from '../components/admin/AdminTickets';
import Reports from '../components/admin/Reports';
import NotificationCenter from '../components/admin/NotificationCenter';
import SystemMaintenance from '../components/admin/SystemMaintenance';
import ProfilePage from '../components/ProfilePage';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Ticket as TicketType, User } from '../lib/types';
import { 
  Ticket, 
  Users, 
  CheckCircle, 
  Activity,
  TrendingUp,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminDashboardProps {
  onLogout: () => void;
  currentUserId?: string;
}

export default function AdminDashboard({ onLogout, currentUserId }: AdminDashboardProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false }); // Order by most recent first
      if (error) {
        console.error('Error fetching tickets:', error);
      } else {
        setTickets(data);
      }
    };

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data);
      }
    };

    fetchTickets();
    fetchUsers();
  }, []);

  const stats = getTicketStats(tickets);

  // Calculate ticket trends from actual data (last 6 months)
  const ticketTrendData = calculateTicketTrends(tickets);

  const categoryData = [
    { name: 'Hardware', value: tickets.filter(t => t.category === 'Hardware').length },
    { name: 'Software', value: tickets.filter(t => t.category === 'Software').length },
    { name: 'Network', value: tickets.filter(t => t.category === 'Network').length },
    { name: 'Account', value: tickets.filter(t => t.category === 'Account').length },
  ];

  const COLORS = ['#8B4789', '#4299E1', '#F97316', '#10B981'];

  const resolutionRate = stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : '0.0';

  const handleViewTicket = (ticketId: string) => {
    // Handle the ticket click event here
    console.log('View ticket:', ticketId);
    setCurrentPage('tickets');
  };

  return (
    <DashboardLayout
      userRole="admin"
      userName={user?.name || "Administrator"}
      userEmail={user?.email || "admin@lpu.edu.ph"}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={onLogout}
      onNotificationTicketClick={handleViewTicket}
    >
      {currentPage === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-xl p-8 text-white">
            <h1 className="font-['Josefin_Sans',sans-serif] text-3xl mb-2">
              Welcome back, {user?.name || "Administrator"}!
            </h1>
            <p className="font-['Abel',sans-serif] text-white/90">
              Here's what's happening with your IT Helpdesk system today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Tickets"
              value={stats.total}
              icon={Ticket}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              trend={{ value: '12% from last month', isPositive: true }}
            />
            <StatCard
              title="Active Tickets"
              value={stats.active}
              icon={Activity}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              trend={{ value: '8% from last month', isPositive: false }}
            />
            <StatCard
              title="Resolved Tickets"
              value={stats.resolved}
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              trend={{ value: '23% from last month', isPositive: true }}
            />
            <StatCard
              title="Active Users"
              value={users.filter(u => u.status === 'active').length}
              icon={Users}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Trends Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900">
                  Ticket Trends
                </h2>
                <TrendingUp className="text-[#8B0000]" size={20} />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ticketTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8B0000" 
                    strokeWidth={3}
                    dot={{ fill: '#8B0000', r: 4 }}
                    name="Total Tickets"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 4 }}
                    name="Resolved Tickets"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900">
                  Tickets by Category
                </h2>
                <AlertTriangle className="text-[#8B0000]" size={20} />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900 mb-1">
                  Resolution Rate
                </h2>
                <p className="text-gray-500 text-sm font-['Abel',sans-serif]">
                  Overall system performance
                </p>
              </div>
              <div className="text-right">
                <p className="font-['Josefin_Sans',sans-serif] text-3xl text-[#8B0000]">
                  {resolutionRate}%
                </p>
                <p className="text-sm text-gray-500 font-['Abel',sans-serif]">Success Rate</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] h-3 rounded-full transition-all duration-500"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900">
                Recent Tickets
              </h2>
              <button className="text-[#8B0000] hover:text-[#6B0000] font-['Abel',sans-serif] text-sm">
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tickets.slice(0, 4).map((ticket) => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  onClick={() => {}} 
                  showAssignee 
                />
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-['Abel',sans-serif]">ICT Staff</p>
                  <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">
                    {users.filter(u => u.role === 'ict').length}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-['Abel',sans-serif]">All staff members active</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-['Abel',sans-serif]">Faculty</p>
                  <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">
                    {users.filter(u => u.role === 'faculty').length}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-['Abel',sans-serif]">Registered users</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-['Abel',sans-serif]">Students</p>
                  <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">
                    {users.filter(u => u.role === 'student').length}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-['Abel',sans-serif]">Registered users</p>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'users' && (
        <UserManagement />
      )}

      {currentPage === 'tickets' && (
        <AdminTickets />
      )}

      {currentPage === 'reports' && (
        <Reports />
      )}

      {currentPage === 'system' && (
        <SystemMaintenance />
      )}

      {currentPage === 'notifications' && (
        <NotificationCenter />
      )}

      {currentPage === 'profile' && (
        <ProfilePage 
          userName={user?.name || "Administrator"}
          userEmail={user?.email || "admin@lpu.edu.ph"}
          userRole="admin"
          userId={user?.id || currentUserId || ""}
        />
      )}
    </DashboardLayout>
  );
}

function getTicketStats(tickets: TicketType[]) {
  return {
    total: tickets.length,
    active: tickets.filter(t => t.status !== 'Resolved').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    pending: tickets.filter(t => t.status === 'Pending').length,
  };
}

function calculateTicketTrends(tickets: TicketType[]) {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Generate last 6 months
  const trends: { month: string, total: number, resolved: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trends.push({
      month: monthNames[date.getMonth()],
      total: 0,
      resolved: 0,
    });
  }

  // Count tickets per month
  tickets.forEach(ticket => {
    const ticketDate = new Date(ticket.created_at);
    const monthDiff = (now.getFullYear() - ticketDate.getFullYear()) * 12 + (now.getMonth() - ticketDate.getMonth());
    
    if (monthDiff >= 0 && monthDiff < 6) {
      const index = 5 - monthDiff;
      if (index >= 0 && index < 6) {
        trends[index].total += 1;
        if (ticket.status === 'Resolved') {
          trends[index].resolved += 1;
        }
      }
    }
  });

  return trends;
}