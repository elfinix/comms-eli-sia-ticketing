import { useState, useEffect } from 'react';
import { Ticket } from '../../lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  Clock,
  User,
  Tag,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  Users,
  Paperclip
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../lib/supabaseClient';

const statusColors = {
  'Open': 'bg-blue-100 text-blue-800 border-blue-200',
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'In Progress': 'bg-purple-100 text-purple-800 border-purple-200',
  'Resolved': 'bg-green-100 text-green-800 border-green-200',
  'Closed': 'bg-gray-100 text-gray-800 border-gray-200',
};

const urgencyColors = {
  'High': 'text-red-600',
  'Medium': 'text-orange-600',
  'Low': 'text-green-600',
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [assignedStaffNames, setAssignedStaffNames] = useState<{ [key: string]: string }>({});

  const [editFormData, setEditFormData] = useState({
    status: '',
    category: '',
    urgency: '',
  });

  // Fetch tickets from Supabase
  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching tickets:', error);
      } else {
        const ticketsData = data as Ticket[];
        
        // Fetch submitter names and assigned staff names
        const userIds = new Set<string>();
        ticketsData.forEach(ticket => {
          if (ticket.submitted_by) {
            userIds.add(ticket.submitted_by);
          }
          if (ticket.assigned_to && Array.isArray(ticket.assigned_to)) {
            ticket.assigned_to.forEach((id: string) => userIds.add(id));
          }
        });
        
        if (userIds.size > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name')
            .in('id', Array.from(userIds));
            
          if (!usersError && usersData) {
            const namesMap: { [key: string]: string } = {};
            usersData.forEach((user: any) => {
              namesMap[user.id] = user.name;
            });
            
            // Add submitted_by_name to each ticket
            const enrichedTickets = ticketsData.map(ticket => ({
              ...ticket,
              submitted_by_name: ticket.submitted_by ? namesMap[ticket.submitted_by] : 'Unknown'
            }));
            
            setTickets(enrichedTickets);
            setAssignedStaffNames(namesMap);
            return;
          }
        }
        
        setTickets(ticketsData);
      }
    };
    
    fetchTickets();

    // Set up realtime subscription for ticket updates
    const channel = supabase
      .channel('admin-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesUrgency = urgencyFilter === 'all' || ticket.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesUrgency;
  });

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditFormData({
      status: ticket.status,
      category: ticket.category,
      urgency: ticket.urgency,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    
    // Update ticket in database
    const { error } = await supabase
      .from('tickets')
      .update(editFormData)
      .eq('id', selectedTicket.id);
      
    if (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
      return;
    }
    
    setTickets(tickets.map(t => 
      t.id === selectedTicket.id 
        ? { ...t, ...editFormData }
        : t
    ));
    
    setIsEditDialogOpen(false);
    setSelectedTicket(null);
    toast.success('Ticket updated successfully!');
  };

  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    
    // Delete from database
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketToDelete);
      
    if (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
      return;
    }
    
    setTickets(tickets.filter(t => t.id !== ticketToDelete));
    setIsDeleteDialogOpen(false);
    setTicketToDelete(null);
    toast.success('Ticket deleted successfully!');
  };

  const handleAssignTicket = async (ticket: Ticket) => {
    if (ticket.assigned_to && ticket.assigned_to.length > 0) {
      toast.info('This ticket is already assigned');
      return;
    }

    try {
      // Map category to ICT department
      const department = `ICT - ${ticket.category}`;
      
      // Get all ICT staff from the matching department
      const { data: ictStaff, error: ictError } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'ict')
        .eq('department', department)
        .eq('status', 'active');

      if (ictError) {
        console.error('Error fetching ICT staff:', ictError);
        toast.error('Failed to assign ticket');
        return;
      }

      if (!ictStaff || ictStaff.length === 0) {
        toast.warning(`No active ICT staff found in ${department}`);
        return;
      }

      // Store all assigned ICT staff IDs as an array
      const assignedStaffIds = ictStaff.map(staff => staff.id);

      // Update ticket with assigned staff
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ assigned_to: assignedStaffIds })
        .eq('id', ticket.id);

      if (updateError) {
        console.error('Error updating ticket:', updateError);
        toast.error('Failed to assign ticket');
        return;
      }

      // Get user preferences for all assigned ICT staff
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('user_id, ticket_updates')
        .in('user_id', assignedStaffIds);

      // Create notifications only for users who have ticket_updates enabled
      const notificationsToCreate = ictStaff
        .filter(staff => {
          const userPref = preferences?.find(p => p.user_id === staff.id);
          // Default to true if preference not found
          return userPref?.ticket_updates !== false;
        })
        .map(staff => ({
          user_id: staff.id,
          title: 'New Ticket Assigned',
          message: `New ${ticket.category} ticket "${ticket.title}" has been assigned to your department.`,
          type: 'info' as const,
          is_read: false,
          ticket_id: ticket.id,
        }));

      if (notificationsToCreate.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notificationsToCreate);

        if (notifError) {
          console.error('Error creating notifications:', notifError);
        }
      }

      // Update local state
      setTickets(tickets.map(t => 
        t.id === ticket.id 
          ? { ...t, assigned_to: assignedStaffIds }
          : t
      ));
      
      // Update assigned staff names
      const updatedNames = { ...assignedStaffNames };
      ictStaff.forEach(staff => {
        updatedNames[staff.id] = staff.name;
      });
      setAssignedStaffNames(updatedNames);

      const assignedNames = ictStaff.map(s => s.name).join(', ');
      toast.success(`Ticket assigned successfully!`, {
        description: `Assigned to ${department}: ${assignedNames}`,
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const getAssignedStaffDisplay = (ticket: Ticket) => {
    if (!ticket.assigned_to || ticket.assigned_to.length === 0) {
      return 'Unassigned';
    }
    
    // Return the department based on ticket category
    return `ICT - ${ticket.category}`;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    pending: tickets.filter(t => t.status === 'Pending').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Total Tickets</p>
          <p className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900">{stats.total}</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Open</p>
          <p className="font-['Josefin_Sans',sans-serif] text-2xl text-blue-600">{stats.open}</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">In Progress</p>
          <p className="font-['Josefin_Sans',sans-serif] text-2xl text-purple-600">{stats.inProgress}</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-1">Resolved</p>
          <p className="font-['Josefin_Sans',sans-serif] text-2xl text-green-600">{stats.resolved}</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div>
            <h2 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900 mb-1">
              All Tickets
            </h2>
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
              View and manage all support tickets
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
                <SelectItem value="Account">Account</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tickets List */}
        <div className="divide-y divide-gray-200">
          {filteredTickets.map((ticket) => {
            const isAssigned = ticket.assigned_to && ticket.assigned_to.length > 0;
            
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-['Josefin_Sans',sans-serif] text-gray-900">
                        {ticket.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-['Abel',sans-serif] border ${statusColors[ticket.status] || statusColors['Open']}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-['Abel',sans-serif] mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Tag size={14} />
                        <span className="font-['Abel',sans-serif]">{ticket.id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag size={14} />
                        <span className="font-['Abel',sans-serif]">{ticket.category}</span>
                      </div>
                      <div className={`flex items-center gap-1 ${urgencyColors[ticket.urgency]}`}>
                        <AlertCircle size={14} />
                        <span className="font-['Abel',sans-serif]">{ticket.urgency} Priority</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span className="font-['Abel',sans-serif]">
                          {new Date(ticket.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {isAssigned && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Users size={14} />
                          <span className="font-['Abel',sans-serif]">{getAssignedStaffDisplay(ticket)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTicket(ticket)}
                      className="gap-2"
                    >
                      <Eye size={14} />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTicket(ticket)}
                      className="gap-2"
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                    <Button
                      variant={isAssigned ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAssignTicket(ticket)}
                      className={`gap-2 ${
                        isAssigned 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                      }`}
                      disabled={isAssigned}
                    >
                      {isAssigned ? (
                        <>
                          <CheckCircle2 size={14} />
                          Assigned
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          Assign
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(ticket.id)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-['Abel',sans-serif]">No tickets found</p>
          </div>
        )}
      </div>

      {/* View Ticket Dialog - Improved UI */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif] text-2xl">Ticket Details</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif] text-gray-500">
              Full information about this support ticket
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6 py-4">
              {/* Ticket ID Badge */}
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-['Abel',sans-serif] text-sm px-3 py-1">
                  {selectedTicket.id}
                </Badge>
                <Badge className={`${statusColors[selectedTicket.status] || statusColors['Open']} font-['Abel',sans-serif]`}>
                  {selectedTicket.status}
                </Badge>
                <Badge className={`${urgencyColors[selectedTicket.urgency]} bg-opacity-10 border font-['Abel',sans-serif]`}>
                  {selectedTicket.urgency} Priority
                </Badge>
              </div>

              {/* Title */}
              <div className="bg-gradient-to-br from-[#8B0000] to-[#6B0000] text-white p-6 rounded-lg">
                <Label className="font-['Abel',sans-serif] text-gray-200 text-xs uppercase tracking-wide">Title</Label>
                <p className="mt-2 font-['Josefin_Sans',sans-serif] text-xl">{selectedTicket.title}</p>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <Label className="font-['Abel',sans-serif] text-gray-700">Description</Label>
                <p className="mt-2 text-sm font-['Abel',sans-serif] text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Attachment */}
              {selectedTicket.attachment_url && (
                <div className="bg-white border-2 border-[#8B0000] p-6 rounded-lg">
                  <Label className="font-['Abel',sans-serif] text-gray-700">Attachment</Label>
                  <a
                    href={selectedTicket.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-[#8B0000] hover:text-[#6B0000] font-['Abel',sans-serif] transition-colors"
                  >
                    <Paperclip size={18} />
                    View Attached File
                  </a>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <Label className="font-['Abel',sans-serif] text-gray-500 text-xs">Category</Label>
                  <p className="mt-1 font-['Abel',sans-serif] text-gray-900">{selectedTicket.category}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <Label className="font-['Abel',sans-serif] text-gray-500 text-xs">Assigned To</Label>
                  <p className="mt-1 font-['Abel',sans-serif] text-gray-900">
                    {getAssignedStaffDisplay(selectedTicket)}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <Label className="font-['Abel',sans-serif] text-gray-500 text-xs">Submitted By</Label>
                  <p className="mt-1 font-['Abel',sans-serif] text-gray-900">{selectedTicket.submitted_by_name || 'Unknown'}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <Label className="font-['Abel',sans-serif] text-gray-500 text-xs">Created At</Label>
                  <p className="mt-1 font-['Abel',sans-serif] text-gray-900">
                    {new Date(selectedTicket.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
              className="font-['Abel',sans-serif]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Josefin_Sans',sans-serif]">Edit Ticket</DialogTitle>
            <DialogDescription className="font-['Abel',sans-serif]">
              Update ticket status and categorization
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-['Abel',sans-serif] text-gray-600 mb-1">Ticket</p>
                <p className="font-['Josefin_Sans',sans-serif] text-gray-900">{selectedTicket.title}</p>
              </div>
              <div>
                <Label htmlFor="edit-status" className="font-['Abel',sans-serif]">Status</Label>
                <Select 
                  value={editFormData.status} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                >
                  <SelectTrigger id="edit-status" className="mt-2">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-category" className="font-['Abel',sans-serif]">Category</Label>
                <Select 
                  value={editFormData.category} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
                >
                  <SelectTrigger id="edit-category" className="mt-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Network">Network</SelectItem>
                    <SelectItem value="Account">Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-urgency" className="font-['Abel',sans-serif]">Urgency</Label>
                <Select 
                  value={editFormData.urgency} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, urgency: value })}
                >
                  <SelectTrigger id="edit-urgency" className="mt-2">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTicket}
              className="bg-[#8B0000] hover:bg-[#6B0000]"
              type="button"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Josefin_Sans',sans-serif]">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-['Abel',sans-serif]">
              This action cannot be undone. This will permanently delete the ticket
              and remove all associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-['Abel',sans-serif]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 font-['Abel',sans-serif]"
            >
              Delete Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}