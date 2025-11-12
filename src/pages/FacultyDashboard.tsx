import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import TicketCard from '../components/TicketCard';
import NotificationsPage from '../components/NotificationsPage';
import ProfilePage from '../components/ProfilePage';
import ChatPage from '../components/ChatPage';
import HistoryPage from '../components/HistoryPage';
import SettingsPage from '../components/SettingsPage';
import ViewTicketModal from '../components/ViewTicketModal';
import NewTicketModal from '../components/NewTicketModal';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Ticket as TicketType } from '../lib/types';
import { 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle, 
  Activity,
  Plus,
  Bell
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

interface FacultyDashboardProps {
  onLogout: () => void;
  currentUserId?: string;
}

export default function FacultyDashboard({ onLogout, currentUserId }: FacultyDashboardProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user } = useAuth();
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showViewTicketModal, setShowViewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Use real user ID from auth context
  const facultyId = user?.id || currentUserId || 'faculty-1';
  const [allTickets, setAllTickets] = useState<TicketType[]>([]);
  const [ticketDepartments, setTicketDepartments] = useState<Record<string, string>>({});

  // Get first name from full name
  const firstName = user?.name?.split(' ')[0] || 'Faculty';

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('submitted_by', facultyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
    } else {
      setAllTickets(data as TicketType[]);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Set up realtime subscription for ticket updates
    const channel = supabase
      .channel('faculty-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `submitted_by=eq.${facultyId}`,
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [facultyId]);
  
  // Fetch department names for assigned tickets
  useEffect(() => {
    const fetchDepartments = async () => {
      const departments: Record<string, string> = {};
      
      for (const ticket of allTickets) {
        if (ticket.assigned_to) {
          try {
            // Parse assigned_to - it could be a string UUID, JSON array, or postgres array
            let staffIds: string[] = [];
            
            if (typeof ticket.assigned_to === 'string') {
              // Try parsing as JSON first
              if (ticket.assigned_to.startsWith('[') || ticket.assigned_to.startsWith('{')) {
                try {
                  staffIds = JSON.parse(ticket.assigned_to);
                } catch {
                  staffIds = [ticket.assigned_to];
                }
              } else {
                staffIds = [ticket.assigned_to];
              }
            } else if (Array.isArray(ticket.assigned_to)) {
              staffIds = ticket.assigned_to;
            }

            if (staffIds.length > 0) {
              // Fetch departments for all assigned staff
              const { data, error } = await supabase
                .from('users')
                .select('department')
                .in('id', staffIds);

              if (!error && data && data.length > 0) {
                // Get unique departments
                const uniqueDepts = [...new Set(data.map(u => u.department).filter(Boolean))];
                departments[ticket.id] = uniqueDepts.join(', ') || 'Not Assigned';
              } else {
                departments[ticket.id] = 'Not Assigned';
              }
            }
          } catch (err) {
            console.error('Error parsing assigned_to for ticket:', ticket.id, err);
            departments[ticket.id] = 'Not Assigned';
          }
        }
      }
      
      setTicketDepartments(departments);
    };

    if (allTickets.length > 0) {
      fetchDepartments();
    }
  }, [allTickets]);
  
  // Filter tickets: Only show Open/In Progress on Tickets page
  const myTickets = allTickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
  
  // All tickets (including Resolved/Closed) for History page
  const historyTickets = allTickets;

  const stats = {
    total: allTickets.length,
    pending: allTickets.filter(t => t.status === 'Open').length,
    inProgress: allTickets.filter(t => t.status === 'In Progress').length,
    resolved: allTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
  };

  const recentUpdates = [
    {
      id: 1,
      title: 'System Maintenance Scheduled',
      message: 'LMS will be under maintenance on Jan 15, 2025 from 2:00 AM - 4:00 AM',
      date: '2 hours ago',
      type: 'info' as const,
    },
    {
      id: 2,
      title: 'New WiFi Access Points',
      message: 'New WiFi access points installed in Building A, improving connectivity',
      date: '1 day ago',
      type: 'success' as const,
    },
  ];

  const handleViewTicket = (ticketId: string) => {
    // Find the ticket from all tickets
    const ticket = allTickets.find(t => t.id === ticketId);
    if (ticket) {
      // Use real database data
      setSelectedTicket({
        ...ticket,
        createdAt: ticket.created_at,
        priority: ticket.urgency,
        assignedTo: ticket.assigned_to || undefined,
        submittedBy: user?.name || 'Unknown User',
        submittedByRole: 'faculty',
      } as any);
      setShowViewTicketModal(true);
    }
  };

  const handleNavigateToChat = (contactId: string) => {
    // Store the contact ID in sessionStorage so ChatPage can auto-select it
    sessionStorage.setItem('chatContactId', contactId);
    setCurrentPage('chat');
  };

  const handleNavigateToChatSimple = () => {
    setCurrentPage('chat');
  };

  return (
    <DashboardLayout
      userRole="faculty"
      userName={user?.name || "Prof. Roberto Garcia"}
      userEmail={user?.email || "roberto.garcia@lyceum-cavite.edu.ph"}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={onLogout}
      onNotificationTicketClick={handleViewTicket}
      onNotificationChatClick={handleNavigateToChatSimple}
    >
      {currentPage === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-xl p-8 text-white">
            <h1 className="font-['Josefin_Sans',sans-serif] text-3xl mb-2">
              Welcome, {firstName}!
            </h1>
            <p className="font-['Abel',sans-serif] text-white/90">
              Manage your support tickets and stay updated with ICT announcements.
            </p>
          </div>

          {/* Quick Actions */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowNewTicketModal(true)}
            className="bg-gradient-to-br from-[#8B0000] via-[#6B0000] to-[#4B0000] rounded-xl p-6 cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-white mb-2">
                  Need Technical Support?
                </h2>
                <p className="font-['Abel',sans-serif] text-white/90 mb-4">
                  Submit a new ticket and our ICT team will assist you promptly
                </p>
                <Button className="bg-white text-[#8B0000] hover:bg-gray-100 gap-2">
                  <Plus size={18} />
                  Submit New Ticket
                </Button>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                  <TicketIcon className="text-white" size={48} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Tickets"
              value={stats.total}
              icon={TicketIcon}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
            />
            <StatCard
              title="Open"
              value={stats.pending}
              icon={Clock}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
            />
            <StatCard
              title="In Progress"
              value={stats.inProgress}
              icon={Activity}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
            />
            <StatCard
              title="Resolved"
              value={stats.resolved}
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Tickets */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900">
                  My Active Tickets
                </h2>
                <button 
                  onClick={() => setCurrentPage('tickets')}
                  className="text-[#8B0000] hover:text-[#6B0000] font-['Abel',sans-serif] text-sm"
                >
                  View All →
                </button>
              </div>

              {myTickets.length > 0 ? (
                <div className="space-y-4">
                  {myTickets.slice(0, 3).map((ticket) => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={{
                        ...ticket,
                        assignedToName: ticketDepartments[ticket.id]
                      }} 
                      onClick={() => handleViewTicket(ticket.id)}
                      showAssignee
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TicketIcon className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500 font-['Abel',sans-serif] mb-4">No active tickets</p>
                  <Button 
                    onClick={() => setCurrentPage('new-ticket')}
                    className="bg-[#8B0000] hover:bg-[#6B0000] text-white gap-2"
                  >
                    <Plus size={18} />
                    Submit Your First Ticket
                  </Button>
                </div>
              )}
            </div>

            {/* Updates & Notifications */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="text-[#8B0000]" size={20} />
                <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900">
                  ICT Updates
                </h2>
              </div>

              <div className="space-y-4">
                {recentUpdates.map((update) => (
                  <div 
                    key={update.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        update.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-['Abel',sans-serif] text-sm text-gray-900 mb-1">
                          {update.title}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          {update.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {update.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-['Josefin_Sans',sans-serif] text-lg text-blue-900 mb-3">
              💡 Quick Tips
            </h3>
            <ul className="space-y-2 font-['Abel',sans-serif] text-sm text-blue-800">
              <li>• Provide detailed descriptions when submitting tickets for faster resolution</li>
              <li>• Set urgency level appropriately to help us prioritize your request</li>
              <li>• Check your email for ticket updates and ICT staff responses</li>
            </ul>
          </div>
        </div>
      )}

      {currentPage === 'tickets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
                My Tickets
              </h2>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                View and track all your submitted tickets
              </p>
            </div>
            <Button 
              onClick={() => setShowNewTicketModal(true)}
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white gap-2"
            >
              <Plus size={18} />
              New Ticket
            </Button>
          </div>

          <div className="space-y-4">
            {myTickets.length > 0 ? (
              myTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewTicket(ticket.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-['Abel',sans-serif] text-sm text-gray-500">
                          {ticket.id}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                          ticket.urgency === 'High' ? 'bg-red-100 text-red-800' :
                          ticket.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.urgency}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                          ticket.status === 'Open' ? 'bg-orange-100 text-orange-800' :
                          ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <h3 className="font-['Abel',sans-serif] text-lg text-gray-900 mb-2">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-gray-500 font-['Abel',sans-serif] mb-3">
                        Category: {ticket.category}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 font-['Abel',sans-serif]">
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.assignedToName && (
                          <>
                            <span>•</span>
                            <span>Assigned to: {ticket.assignedToName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2 self-end md:self-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTicket(ticket.id);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <TicketIcon className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-['Abel',sans-serif]">No tickets found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentPage === 'chat' && (
        <ChatPage currentUserId={facultyId} currentUserRole="faculty" />
      )}

      {currentPage === 'history' && (
        <HistoryPage onViewTicket={handleViewTicket} tickets={historyTickets} />
      )}

      {currentPage === 'settings' && (
        <SettingsPage />
      )}

      {currentPage === 'notifications' && (
        <NotificationsPage onNavigateToChat={handleNavigateToChatSimple} />
      )}

      {currentPage === 'profile' && (
        <ProfilePage 
          userName={user?.name || "Faculty"}
          userEmail={user?.email || "faculty@lpu.edu.ph"}
          userRole="faculty"
          userId={facultyId}
        />
      )}

      {/* View Ticket Modal */}
      <ViewTicketModal
        open={showViewTicketModal}
        onOpenChange={setShowViewTicketModal}
        ticket={selectedTicket}
        userRole="faculty"
        onNavigateToChat={handleNavigateToChat}
      />

      {/* New Ticket Modal */}
      <NewTicketModal
        open={showNewTicketModal}
        onOpenChange={setShowNewTicketModal}
        userRole="faculty"
        onTicketCreated={fetchTickets}
      />
    </DashboardLayout>
  );
}