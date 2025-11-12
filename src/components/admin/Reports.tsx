import { useState, useEffect } from 'react';
import { Ticket } from '../../lib/types';
import { Button } from '../ui/button';
import { 
  Download, 
  Calendar,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner@2.0.3';

export default function Reports() {
  const [timeRange, setTimeRange] = useState('month');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        toast.error('Failed to load tickets data');
      } else {
        setTickets(ticketsData as Ticket[]);
      }
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast.error('Failed to load users data');
      } else {
        setUsers(usersData);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [timeRange]);

  // Filter tickets by time range
  const getFilteredTickets = () => {
    const now = new Date();
    const filtered = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      const diffTime = now.getTime() - ticketDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      
      switch (timeRange) {
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        case 'quarter':
          return diffDays <= 90;
        case 'year':
          return diffDays <= 365;
        default:
          return true;
      }
    });
    return filtered;
  };

  const filteredTickets = getFilteredTickets();

  // Calculate statistics
  const totalTickets = filteredTickets.length;
  const resolvedTickets = filteredTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const pendingTickets = filteredTickets.filter(t => t.status === 'Pending').length;
  const inProgressTickets = filteredTickets.filter(t => t.status === 'In Progress').length;
  const openTickets = filteredTickets.filter(t => t.status === 'Open').length;

  const resolutionRate = totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : '0';
  
  // Calculate average resolution time
  const calculateAvgResolutionTime = () => {
    const resolvedTicketsWithTime = filteredTickets.filter(t => 
      (t.status === 'Resolved' || t.status === 'Closed') && t.resolved_at
    );
    
    if (resolvedTicketsWithTime.length === 0) return '0h';
    
    const totalMinutes = resolvedTicketsWithTime.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at).getTime();
      const resolved = new Date(ticket.resolved_at!).getTime();
      const diff = (resolved - created) / (1000 * 60); // minutes
      return sum + diff;
    }, 0);
    
    const avgMinutes = totalMinutes / resolvedTicketsWithTime.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.floor(avgMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const avgResolutionTime = calculateAvgResolutionTime();

  // Category distribution
  const categoryData = [
    { 
      name: 'Hardware', 
      value: filteredTickets.filter(t => t.category === 'Hardware').length, 
      color: '#8B4789' 
    },
    { 
      name: 'Software', 
      value: filteredTickets.filter(t => t.category === 'Software').length, 
      color: '#4299E1' 
    },
    { 
      name: 'Network', 
      value: filteredTickets.filter(t => t.category === 'Network').length, 
      color: '#F97316' 
    },
    { 
      name: 'Account', 
      value: filteredTickets.filter(t => t.category === 'Account').length, 
      color: '#10B981' 
    },
  ];

  // Monthly ticket trends (last 6 months)
  const getMonthlyData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthTickets = tickets.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate.getMonth() === date.getMonth() && 
               ticketDate.getFullYear() === date.getFullYear();
      });
      
      months.push({
        month: monthName,
        submitted: monthTickets.length,
        resolved: monthTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
        pending: monthTickets.filter(t => t.status === 'Pending' || t.status === 'Open').length,
      });
    }
    
    return months;
  };

  const monthlyData = getMonthlyData();

  // User role distribution
  const getRoleDistribution = () => {
    const ticketsWithRole = filteredTickets.filter(t => t.submitted_by);
    const userIds = [...new Set(ticketsWithRole.map(t => t.submitted_by))];
    
    const studentCount = userIds.filter(id => {
      const user = users.find(u => u.id === id);
      return user?.role === 'student';
    }).length;
    
    const facultyCount = userIds.filter(id => {
      const user = users.find(u => u.id === id);
      return user?.role === 'faculty';
    }).length;
    
    const ictCount = userIds.filter(id => {
      const user = users.find(u => u.id === id);
      return user?.role === 'ict';
    }).length;
    
    return [
      { name: 'Students', value: studentCount, color: '#F97316' },
      { name: 'Faculty', value: facultyCount, color: '#10B981' },
      { name: 'ICT Staff', value: ictCount, color: '#4299E1' },
    ];
  };

  const userRoleData = getRoleDistribution();

  // ICT Staff Performance
  const getStaffPerformance = () => {
    const ictStaff = users.filter(u => u.role === 'ict');
    
    return ictStaff.map(staff => {
      const assignedTickets = filteredTickets.filter(t => 
        t.assigned_to && Array.isArray(t.assigned_to) && t.assigned_to.includes(staff.id)
      );
      
      const resolvedByStaff = assignedTickets.filter(t => 
        t.status === 'Resolved' || t.status === 'Closed'
      );
      
      const activeTickets = assignedTickets.filter(t => 
        t.status === 'Open' || t.status === 'In Progress' || t.status === 'Pending'
      );
      
      // Calculate avg resolution time for this staff
      const resolvedWithTime = resolvedByStaff.filter(t => t.resolved_at);
      let avgTime = '0h';
      
      if (resolvedWithTime.length > 0) {
        const totalMinutes = resolvedWithTime.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at).getTime();
          const resolved = new Date(ticket.resolved_at!).getTime();
          const diff = (resolved - created) / (1000 * 60);
          return sum + diff;
        }, 0);
        
        const avgMinutes = totalMinutes / resolvedWithTime.length;
        const hours = Math.floor(avgMinutes / 60);
        const minutes = Math.floor(avgMinutes % 60);
        
        if (hours > 0) {
          avgTime = `${hours}h ${minutes}m`;
        } else {
          avgTime = `${minutes}m`;
        }
      }
      
      return {
        name: staff.name,
        resolved: resolvedByStaff.length,
        avgTime,
        activeTickets: activeTickets.length,
      };
    }).filter(staff => staff.resolved > 0 || staff.activeTickets > 0);
  };

  const staffPerformance = getStaffPerformance();

  // Urgency distribution
  const urgencyData = [
    { name: 'High', value: filteredTickets.filter(t => t.urgency === 'High').length },
    { name: 'Medium', value: filteredTickets.filter(t => t.urgency === 'Medium').length },
    { name: 'Low', value: filteredTickets.filter(t => t.urgency === 'Low').length },
  ];

  // Active users count
  const activeUsers = users.filter(u => u.status === 'active').length;

  // Export functions
  const handleExportPDF = () => {
    toast.info('Generating PDF report...');
    
    // Dynamically import jsPDF
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      // Set font
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('LYCEUM IT HELPDESK', 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.text('Reports & Analytics', 105, 28, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 38);
      doc.text(`Time Range: ${timeRange}`, 20, 44);
      
      // Key Metrics Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('KEY METRICS', 20, 55);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 63;
      doc.text(`Total Tickets: ${totalTickets}`, 25, y);
      y += 6;
      doc.text(`Resolved: ${resolvedTickets}`, 25, y);
      y += 6;
      doc.text(`Pending: ${pendingTickets}`, 25, y);
      y += 6;
      doc.text(`In Progress: ${inProgressTickets}`, 25, y);
      y += 6;
      doc.text(`Resolution Rate: ${resolutionRate}%`, 25, y);
      y += 6;
      doc.text(`Avg Resolution Time: ${avgResolutionTime}`, 25, y);
      y += 6;
      doc.text(`Active Users: ${activeUsers}`, 25, y);
      y += 10;
      
      // Category Breakdown
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CATEGORY BREAKDOWN', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      categoryData.forEach(c => {
        doc.text(`${c.name}: ${c.value} tickets`, 25, y);
        y += 6;
      });
      y += 4;
      
      // Urgency Breakdown
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('URGENCY BREAKDOWN', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      urgencyData.forEach(u => {
        doc.text(`${u.name}: ${u.value} tickets`, 25, y);
        y += 6;
      });
      y += 4;
      
      // ICT Staff Performance
      if (staffPerformance.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ICT STAFF PERFORMANCE', 20, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        staffPerformance.forEach(s => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${s.name}:`, 25, y);
          y += 6;
          doc.text(`  Resolved: ${s.resolved} tickets`, 30, y);
          y += 6;
          doc.text(`  Avg Time: ${s.avgTime}`, 30, y);
          y += 6;
          doc.text(`  Active: ${s.activeTickets} tickets`, 30, y);
          y += 8;
        });
      }
      
      // Save the PDF
      doc.save(`helpdesk-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF report downloaded successfully!');
    }).catch((error) => {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    });
  };

  const handleExportExcel = () => {
    toast.info('Generating Excel report...');
    
    // Dynamically import xlsx
    import('xlsx').then((XLSX) => {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Summary
      const summaryData = [
        ['LYCEUM IT HELPDESK REPORT'],
        [],
        ['Generated', new Date().toLocaleString()],
        ['Time Range', timeRange],
        [],
        ['KEY METRICS'],
        ['Metric', 'Value'],
        ['Total Tickets', totalTickets],
        ['Resolved', resolvedTickets],
        ['Pending', pendingTickets],
        ['In Progress', inProgressTickets],
        ['Resolution Rate', `${resolutionRate}%`],
        ['Avg Resolution Time', avgResolutionTime],
        ['Active Users', activeUsers],
        [],
        ['CATEGORY DISTRIBUTION'],
        ['Category', 'Count'],
        ...categoryData.map(c => [c.name, c.value]),
        [],
        ['URGENCY BREAKDOWN'],
        ['Priority', 'Count'],
        ...urgencyData.map(u => [u.name, u.value]),
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
      
      // Sheet 2: Staff Performance
      if (staffPerformance.length > 0) {
        const staffData = [
          ['ICT STAFF PERFORMANCE'],
          [],
          ['Staff Member', 'Resolved Tickets', 'Avg Resolution Time', 'Active Tickets'],
          ...staffPerformance.map(s => [s.name, s.resolved, s.avgTime, s.activeTickets])
        ];
        
        const ws2 = XLSX.utils.aoa_to_sheet(staffData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Staff Performance');
      }
      
      // Sheet 3: Detailed Tickets
      const ticketsData = [
        ['TICKET DETAILS'],
        [],
        ['Ticket ID', 'Title', 'Status', 'Category', 'Urgency', 'Created At', 'Resolved At', 'Submitted By'],
        ...filteredTickets.map(ticket => {
          const submittedBy = users.find(u => u.id === ticket.submitted_by)?.name || 'Unknown';
          const createdAt = new Date(ticket.created_at).toLocaleString();
          const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : 'N/A';
          
          return [
            ticket.id,
            ticket.title,
            ticket.status,
            ticket.category,
            ticket.urgency,
            createdAt,
            resolvedAt,
            submittedBy
          ];
        })
      ];
      
      const ws3 = XLSX.utils.aoa_to_sheet(ticketsData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Tickets');
      
      // Write the file
      XLSX.writeFile(wb, `helpdesk-report-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel report downloaded successfully!');
    }).catch((error) => {
      console.error('Error generating Excel:', error);
      toast.error('Failed to generate Excel. Please try again.');
    });
  };

  const handleExportCSV = () => {
    toast.info('Generating CSV report...');
    
    // Create detailed CSV with all tickets
    let csv = 'Ticket ID,Title,Status,Category,Urgency,Created At,Resolved At,Submitted By\n';
    
    filteredTickets.forEach(ticket => {
      const submittedBy = users.find(u => u.id === ticket.submitted_by)?.name || 'Unknown';
      const createdAt = new Date(ticket.created_at).toLocaleString();
      const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : 'N/A';
      
      csv += `"${ticket.id}","${ticket.title.replace(/"/g, '""')}","${ticket.status}","${ticket.category}","${ticket.urgency}","${createdAt}","${resolvedAt}","${submittedBy}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helpdesk-tickets-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV report downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 font-['Abel',sans-serif]">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
            Reports & Analytics
          </h2>
          <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExportPDF}
          >
            <Download size={18} />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-['Abel',sans-serif] mb-2">Total Tickets</p>
              <p className="font-['Josefin_Sans',sans-serif] text-3xl">{totalTickets}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <BarChart3 size={24} />
            </div>
          </div>
          <p className="text-white/70 text-xs font-['Abel',sans-serif]">In selected time range</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-['Abel',sans-serif] mb-2">Resolution Rate</p>
              <p className="font-['Josefin_Sans',sans-serif] text-3xl">{resolutionRate}%</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="text-white/70 text-xs font-['Abel',sans-serif]">{resolvedTickets} of {totalTickets} resolved</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-['Abel',sans-serif] mb-2">Avg Resolution Time</p>
              <p className="font-['Josefin_Sans',sans-serif] text-3xl">{avgResolutionTime}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-white/70 text-xs font-['Abel',sans-serif]">Based on resolved tickets</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-['Abel',sans-serif] mb-2">Active Users</p>
              <p className="font-['Josefin_Sans',sans-serif] text-3xl">{activeUsers}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <p className="text-white/70 text-xs font-['Abel',sans-serif]">Across all roles</p>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trends */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                Ticket Trends
              </h3>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">Monthly submission and resolution</p>
            </div>
            <TrendingUp className="text-[#8B0000]" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="submitted" 
                stroke="#8B0000" 
                strokeWidth={2}
                name="Submitted"
              />
              <Line 
                type="monotone" 
                dataKey="resolved" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Resolved"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                Category Distribution
              </h3>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">Tickets by issue type</p>
            </div>
            <BarChart3 className="text-[#8B0000]" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgency Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                Urgency Breakdown
              </h3>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">Tickets by priority level</p>
            </div>
            <AlertCircle className="text-[#8B0000]" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={urgencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#8B0000" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Role Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                Tickets by User Role
              </h3>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">Submission breakdown</p>
            </div>
            <Users className="text-[#8B0000]" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={userRoleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
              >
                {userRoleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ICT Staff Performance */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
              ICT Staff Performance
            </h3>
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">Individual performance metrics</p>
          </div>
        </div>
        {staffPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Resolved Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Avg Resolution Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-['Abel',sans-serif] text-gray-500 uppercase">
                    Active Tickets
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staffPerformance.map((staff, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-['Abel',sans-serif] text-sm text-gray-900">
                      {staff.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-['Josefin_Sans',sans-serif] text-lg text-[#8B0000]">
                          {staff.resolved}
                        </span>
                        <span className="text-xs text-gray-500">tickets</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-['Abel',sans-serif] text-sm text-gray-600">
                      {staff.avgTime}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-['Abel',sans-serif]">
                        {staff.activeTickets} active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 font-['Abel',sans-serif]">No ICT staff performance data available</p>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900 mb-1">
              Export Reports
            </h3>
            <p className="text-sm text-gray-600 font-['Abel',sans-serif]">
              Download detailed reports in various formats
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleExportPDF}
              variant="outline"
              className="gap-2"
            >
              <Download size={16} />
              PDF
            </Button>
            <Button 
              onClick={handleExportExcel}
              variant="outline"
              className="gap-2"
            >
              <Download size={16} />
              Excel
            </Button>
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              className="gap-2"
            >
              <Download size={16} />
              CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}