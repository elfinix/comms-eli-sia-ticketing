import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import TicketCard from '../components/TicketCard';
import NotificationsPage from '../components/NotificationsPage';
import ProfilePage from '../components/ProfilePage';
import ChatPageICT from '../components/ChatPageICT';
import SettingsPage from '../components/SettingsPage';
import ViewTicketModal from '../components/ViewTicketModal';
import HistoryPage from '../components/HistoryPage';
import { Ticket } from '../lib/types';
import { 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle, 
  Activity,
  MessageSquare,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner@2.0.3';

interface ICTDashboardProps {
  onLogout: () => void;
  currentUserId?: string;
}

export default function ICTDashboard({ onLogout, currentUserId }: ICTDashboardProps) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>(['Open', 'In Progress']); // Default to Open and In Progress
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [allAssignedTickets, setAllAssignedTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  // Fetch current user and assigned tickets
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return;
      
      setLoading(true);
      
      // Fetch current user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        toast.error('Failed to load user data');
      } else {
        setCurrentUser(userData);
      }
      
      // Fetch tickets assigned to this ICT staff
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .contains('assigned_to', [currentUserId])
        .order('created_at', { ascending: false });
      
      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        toast.error('Failed to load tickets');
      } else {
        console.log('Fetched tickets for ICT staff:', ticketsData);
        console.log('Number of tickets:', ticketsData?.length);
        
        // Fetch submitter names for all tickets
        const submitterIds = [...new Set(ticketsData.map(t => t.submitted_by).filter(Boolean))];
        
        if (submitterIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name, role')
            .in('id', submitterIds);
          
          if (!usersError && usersData) {
            const usersMap = new Map(usersData.map(u => [u.id, u]));
            
            const enrichedTickets = ticketsData.map(ticket => ({
              ...ticket,
              submitted_by_name: ticket.submitted_by ? usersMap.get(ticket.submitted_by)?.name : 'Unknown',
              submitted_by_role: ticket.submitted_by ? usersMap.get(ticket.submitted_by)?.role : 'unknown',
            }));
            
            setAllAssignedTickets(enrichedTickets as Ticket[]);
          } else {
            setAllAssignedTickets(ticketsData as Ticket[]);
          }
        } else {
          setAllAssignedTickets(ticketsData as Ticket[]);
        }
      }
      
      setLoading(false);
    };
    
    fetchData();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('ict-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);
  
  // Filter tickets: Only show Open/In Progress on Tickets page
  const activeTickets = allAssignedTickets.filter(t => statusFilters.includes(t.status));
  
  // All tickets (including Resolved/Closed) for History page
  const historyTickets = allAssignedTickets;

  const stats = {
    total: allAssignedTickets.length,
    pending: allAssignedTickets.filter(t => t.status === 'Open').length,
    inProgress: allAssignedTickets.filter(t => t.status === 'In Progress').length,
    resolved: allAssignedTickets.filter(t => t.status === 'Resolved').length,
    closed: allAssignedTickets.filter(t => t.status === 'Closed').length,
  };
  
  // Log stats for debugging
  console.log('ICT Dashboard Stats:', stats);
  console.log('All assigned tickets statuses:', allAssignedTickets.map(t => ({ id: t.id, status: t.status })));

  // Filter tickets for display
  const filteredTickets = activeTickets.filter(ticket => {
    const statusMatch = statusFilters.includes(ticket.status);
    const categoryMatch = categoryFilters.length === 0 || categoryFilters.includes(ticket.category);
    const searchMatch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && categoryMatch && searchMatch;
  });

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsViewModalOpen(true);
  };

  // Shared function to handle chat navigation for any ticket
  const handleChatClick = async (ticket: Ticket) => {
    console.log('=== CHAT BUTTON CLICKED ===');
    console.log('Ticket:', ticket);
    
    // Get the submitter's user data
    const { data: submitterData, error: submitterError } = await supabase
      .from('users')
      .select('id, name, email, role, department')
      .eq('id', ticket.submitted_by)
      .single();
    
    if (submitterError || !submitterData) {
      console.error('❌ Error fetching submitter:', submitterError);
      toast.error('Failed to load chat');
      return;
    }
    
    console.log('✅ Fetched submitter:', submitterData);
    
    // Get first name of sender
    const firstName = submitterData.name.split(' ')[0];
    console.log('First name:', firstName);
    
    // Check if any message exists between these two users
    console.log('Checking for existing messages...');
    const { data: existingMessages, error: msgError } = await supabase
      .from('chat_messages')
      .select('id')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${submitterData.id}),and(sender_id.eq.${submitterData.id},receiver_id.eq.${currentUserId})`)
      .limit(1);
    
    console.log('Existing messages:', existingMessages);
    
    const isNewConversation = !existingMessages || existingMessages.length === 0;
    
    // If it's a new conversation, send the initial greeting message
    if (isNewConversation) {
      console.log('📨 Sending initial greeting message...');
      const messageData = {
        sender_id: currentUserId,
        receiver_id: submitterData.id,
        message: `Good day, ${firstName}! I have now received your ticket and I am assigned to guide you with your concern. Allow me to review your submitted ticket.`,
        ticket_id: ticket.id,
      };
      console.log('Message data:', messageData);
      
      const { data: insertedMessage, error: insertError } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select();
      
      if (insertError) {
        console.error('❌ Error creating message:', insertError);
        toast.error('Failed to send initial message');
        return;
      }
      
      console.log('✅ Message created successfully:', insertedMessage);
      
      toast.success('Conversation started!');
    } else {
      console.log('✅ Existing conversation found');
    }
    
    // Store the contact ID for ChatPageICT to select
    sessionStorage.setItem('chatContactId', submitterData.id);
    console.log('💾 Stored contact ID in sessionStorage:', submitterData.id);
    console.log('🚀 Navigating to chat page...');
    
    setCurrentPage('chat');
  };

  const handleNavigateToChat = (contactId: string) => {
    // Store the contact ID in sessionStorage so ChatPageICT can auto-select it
    sessionStorage.setItem('chatContactId', contactId);
    setCurrentPage('chat');
  };

  const handleNavigateToChatSimple = () => {
    setCurrentPage('chat');
  };

  const handleTicketUpdate = async (ticketId: string, updates: { status?: string }) => {
    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId);
    
    if (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
      return;
    }
    
    // If status was updated, notify the ticket submitter
    if (updates.status) {
      const ticket = allAssignedTickets.find(t => t.id === ticketId);
      if (ticket && ticket.submitted_by) {
        const statusMessages: Record<string, string> = {
          'In Progress': 'is now being worked on',
          'Resolved': 'has been resolved',
          'Closed': 'has been closed',
          'Open': 'status has been updated',
        };
        
        const message = statusMessages[updates.status] || 'status has been updated';
        
        // Use 'success' type for resolved tickets, 'info' for others
        const notificationType = updates.status === 'Resolved' ? 'success' : 'info';
        
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: ticket.submitted_by,
            title: 'Ticket Status Updated',
            message: `Your ticket "${ticket.title}" ${message}.`,
            type: notificationType,
            is_read: false,
            ticket_id: ticketId,
          });
        
        if (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }
    }
    
    // Update local state
    setAllAssignedTickets(tickets => 
      tickets.map(t => t.id === ticketId ? { ...t, ...updates } : t)
    );
    
    toast.success('Ticket updated successfully!');
  };

  const selectedTicket = selectedTicketId 
    ? allAssignedTickets.find(t => t.id === selectedTicketId)
    : null;

  const mappedTicket = selectedTicket ? {
    id: selectedTicket.id,
    title: selectedTicket.title,
    category: selectedTicket.category,
    priority: selectedTicket.urgency as 'Low' | 'Medium' | 'High',
    status: selectedTicket.status as 'Open' | 'In Progress' | 'Resolved' | 'Closed',
    description: selectedTicket.description,
    createdAt: new Date(selectedTicket.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    assignedTo: selectedTicket.assigned_to, // Pass the actual UUID array
    submittedBy: selectedTicket.submitted_by_name || 'Unknown',
    submittedByRole: (selectedTicket.submitted_by_role || 'student') as 'student' | 'faculty',
    attachment_url: selectedTicket.attachment_url, // Include attachment URL
  } : null;

  // Convert Ticket to display format for TicketCard
  const convertToDisplayTicket = (ticket: Ticket) => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    urgency: ticket.urgency,
    status: ticket.status,
    created_at: ticket.created_at, // Keep database column name
    submittedBy: ticket.submitted_by,
    submittedByName: ticket.submitted_by_name || 'Unknown',
    submittedByRole: ticket.submitted_by_role || 'student',
    assignedTo: ticket.assigned_to,
    assignedToName: `ICT - ${ticket.category}`,
  });

  if (loading) {
    return (
      <DashboardLayout
        userRole="ict"
        userName={currentUser?.name || "Loading..."}
        userEmail={currentUser?.email || ""}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={onLogout}
        onNotificationChatClick={handleNavigateToChatSimple}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 font-['Abel',sans-serif]">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="ict"
      userName={currentUser?.name || "ICT Staff"}
      userEmail={currentUser?.email || ""}
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
              Welcome, {currentUser?.name?.split(' ')[0] || 'ICT Staff'}!
            </h1>
            <p className="font-['Abel',sans-serif] text-white/90">
              You have {stats.pending} open tickets and {stats.inProgress} in progress.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Assigned Tickets"
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

          {/* Assigned Tickets */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900">
                Active Tickets
              </h2>
              <button 
                onClick={() => setCurrentPage('tickets')}
                className="text-[#8B0000] hover:text-[#6B0000] font-['Abel',sans-serif] text-sm"
              >
                View All →
              </button>
            </div>

            {activeTickets.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeTickets.slice(0, 4).map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-[#8B0000] transition-colors">
                    <TicketCard 
                      ticket={convertToDisplayTicket(ticket)} 
                      onClick={() => handleViewTicket(ticket.id)}
                    />
                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={() => handleViewTicket(ticket.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                      >
                        <Eye size={14} />
                        View Details
                      </Button>
                      <Button 
                        onClick={async (e) => {
                          e.stopPropagation(); // Prevent TicketCard onClick from firing
                          console.log('=== DASHBOARD CHAT BUTTON CLICKED ===');
                          console.log('Ticket:', ticket);
                          
                          await handleChatClick(ticket);
                        }}
                        size="sm"
                        className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white gap-2"
                      >
                        <MessageSquare size={14} />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-['Abel',sans-serif]">All caught up! No active tickets.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentPage === 'tickets' && (
        <div className="space-y-6">
          {/* Header with Filters */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
                My Assigned Tickets
              </h2>
              <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
                Manage and resolve tickets assigned to you
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket ID or title..."
                  className="pl-10 font-['Abel',sans-serif]"
                />
              </div>
              
              {/* Status Filter */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="gap-2 font-['Abel',sans-serif]"
                  onClick={() => {
                    setStatusDropdownOpen(!statusDropdownOpen);
                    setCategoryDropdownOpen(false);
                  }}
                >
                  <Filter size={16} />
                  Status ({statusFilters.length})
                </Button>
                {statusDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setStatusDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                      <h4 className="font-['Josefin_Sans',sans-serif] text-sm px-2 py-2">Filter by Status</h4>
                      <div className="space-y-1">
                        {['Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                          <div 
                            key={status} 
                            className="flex items-center space-x-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (statusFilters.includes(status)) {
                                setStatusFilters(statusFilters.filter(s => s !== status));
                              } else {
                                setStatusFilters([...statusFilters, status]);
                              }
                            }}
                          >
                            <Checkbox
                              id={`status-${status}`}
                              checked={statusFilters.includes(status)}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setStatusFilters([...statusFilters, status]);
                                } else {
                                  setStatusFilters(statusFilters.filter(s => s !== status));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`status-${status}`}
                              className="text-sm font-['Abel',sans-serif] cursor-pointer flex-1"
                            >
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="gap-2 font-['Abel',sans-serif]"
                  onClick={() => {
                    setCategoryDropdownOpen(!categoryDropdownOpen);
                    setStatusDropdownOpen(false);
                  }}
                >
                  <Filter size={16} />
                  Category {categoryFilters.length > 0 && `(${categoryFilters.length})`}
                </Button>
                {categoryDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setCategoryDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                      <h4 className="font-['Josefin_Sans',sans-serif] text-sm px-2 py-2">Filter by Category</h4>
                      <div className="space-y-1">
                        {['Hardware', 'Software', 'Network', 'Account'].map((category) => (
                          <div 
                            key={category} 
                            className="flex items-center space-x-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (categoryFilters.includes(category)) {
                                setCategoryFilters(categoryFilters.filter(c => c !== category));
                              } else {
                                setCategoryFilters([...categoryFilters, category]);
                              }
                            }}
                          >
                            <Checkbox
                              id={`category-${category}`}
                              checked={categoryFilters.includes(category)}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCategoryFilters([...categoryFilters, category]);
                                } else {
                                  setCategoryFilters(categoryFilters.filter(c => c !== category));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`category-${category}`}
                              className="text-sm font-['Abel',sans-serif] cursor-pointer flex-1"
                            >
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {(statusFilters.length !== 2 || !statusFilters.includes('Open') || !statusFilters.includes('In Progress') || categoryFilters.length > 0 || searchQuery) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilters(['Open', 'In Progress']);
                    setCategoryFilters([]);
                    setSearchQuery('');
                  }}
                  className="font-['Abel',sans-serif]"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Tickets Grid */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            {filteredTickets.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-500 font-['Abel',sans-serif]">
                  Showing {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-[#8B0000] transition-colors">
                      <TicketCard 
                        ticket={convertToDisplayTicket(ticket)} 
                        onClick={() => handleViewTicket(ticket.id)}
                      />
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => handleViewTicket(ticket.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                        >
                          <Eye size={14} />
                          View & Update
                        </Button>
                        <Button 
                          onClick={async (e) => {
                            e.stopPropagation(); // Prevent TicketCard onClick from firing
                            console.log('=== TICKETS PAGE CHAT BUTTON CLICKED ===');
                            console.log('Ticket:', ticket);
                            
                            await handleChatClick(ticket);
                          }}
                          size="sm"
                          className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white gap-2"
                        >
                          <MessageSquare size={14} />
                          Chat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-['Abel',sans-serif]">
                  {searchQuery || statusFilters.length < 2 || categoryFilters.length > 0 
                    ? 'No tickets match your filters' 
                    : 'No active tickets assigned to you'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentPage === 'chat' && (
        <ChatPageICT currentUserId={currentUserId || ''} currentUserRole="ict" />
      )}

      {currentPage === 'history' && (
        <HistoryPage 
          onViewTicket={handleViewTicket} 
          tickets={historyTickets.map(convertToDisplayTicket)} 
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPage />
      )}

      {currentPage === 'notifications' && (
        <NotificationsPage onNavigateToChat={handleNavigateToChatSimple} />
      )}

      {currentPage === 'profile' && (
        <ProfilePage 
          userName={currentUser?.name || "ICT Staff"}
          userEmail={currentUser?.email || ""}
          userRole="ict"
          userId={currentUserId || currentUser?.id || ""}
        />
      )}

      {/* View Ticket Modal */}
      <ViewTicketModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        ticket={mappedTicket}
        userRole="ict"
        onNavigateToChat={handleNavigateToChat}
        onStatusUpdate={(newStatus) => {
          if (selectedTicketId) {
            handleTicketUpdate(selectedTicketId, { status: newStatus });
          }
        }}
      />
    </DashboardLayout>
  );
}