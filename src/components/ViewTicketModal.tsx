import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, User, Paperclip, Clock, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabaseClient';

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  description: string;
  createdAt: string;
  location?: string;
  assignedTo?: string;
  submittedBy: string;
  submittedByRole: 'student' | 'faculty';
  attachment_url?: string;
}

interface ViewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  userRole: 'student' | 'faculty' | 'ict';
  onNavigateToChat?: () => void;
  onStatusUpdate?: (newStatus: string) => void;
}

export default function ViewTicketModal({ open, onOpenChange, ticket, userRole, onNavigateToChat, onStatusUpdate }: ViewTicketModalProps) {
  const [status, setStatus] = useState(ticket?.status || 'Open');
  const [assignedStaffNames, setAssignedStaffNames] = useState<string[]>([]);
  const [hasChatMessages, setHasChatMessages] = useState(false);

  // Sync status when ticket prop changes
  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
    }
  }, [ticket]);

  useEffect(() => {
    const fetchAssignedStaff = async () => {
      if (!ticket?.assignedTo) {
        setAssignedStaffNames([]);
        return;
      }

      try {
        // assigned_to could be a UUID array or a single UUID
        let staffIds: string[] = [];
        
        if (Array.isArray(ticket.assignedTo)) {
          // Already an array
          staffIds = ticket.assignedTo;
        } else if (typeof ticket.assignedTo === 'string') {
          // Try to parse as JSON, otherwise treat as single ID
          try {
            const parsed = JSON.parse(ticket.assignedTo);
            staffIds = Array.isArray(parsed) ? parsed : [ticket.assignedTo];
          } catch {
            staffIds = [ticket.assignedTo];
          }
        }

        if (staffIds.length === 0) {
          setAssignedStaffNames([]);
          return;
        }

        // Fetch names for all assigned staff
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .in('id', staffIds);

        if (error) {
          console.error('Error fetching assigned staff names:', error);
        } else if (data) {
          setAssignedStaffNames(data.map(u => u.name));
        }
      } catch (error) {
        console.error('Error processing assigned staff:', error);
      }
    };

    const checkChatMessages = async () => {
      if (!ticket?.id) {
        setHasChatMessages(false);
        return;
      }

      try {
        // Check if there are any messages in this ticket's chat
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_id', ticket.id);

        if (error) {
          console.error('Error checking chat messages:', error);
          setHasChatMessages(false);
        } else {
          setHasChatMessages((count || 0) > 0);
        }
      } catch (error) {
        console.error('Error checking chat messages:', error);
        setHasChatMessages(false);
      }
    };

    if (ticket) {
      fetchAssignedStaff();
      checkChatMessages();
    }
  }, [ticket]);

  if (!ticket) return null;

  const formatDate = (dateString: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-purple-100 text-purple-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateStatus = () => {
    toast.success('Ticket status updated successfully!');
    onOpenChange(false);
    if (onStatusUpdate) {
      onStatusUpdate(status);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Ticket #{ticket.id}</span>
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority} Priority
            </Badge>
            <Badge className={getStatusColor(status)}>
              {status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage ticket details, including description, status, and assignment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="font-['Josefin_Sans',sans-serif] text-xl text-gray-900 mb-2">
              {ticket.title}
            </h3>
            <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
              Category: {ticket.category}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-['Abel',sans-serif]">Submitted by</p>
                <p className="font-['Abel',sans-serif] text-gray-900">
                  {ticket.submittedBy} ({ticket.submittedByRole})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-['Abel',sans-serif]">Created on</p>
                <p className="font-['Abel',sans-serif] text-gray-900">{formatDate(ticket.createdAt)}</p>
              </div>
            </div>

            {ticket.assignedTo && (
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 font-['Abel',sans-serif]">Assigned to</p>
                  <p className="font-['Abel',sans-serif] text-gray-900">{assignedStaffNames.join(', ')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="font-['Abel',sans-serif] text-gray-900 mb-2">Description</h4>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="font-['Abel',sans-serif] text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Attachment */}
          {ticket.attachment_url && (
            <div>
              <h4 className="font-['Abel',sans-serif] text-gray-900 mb-2">Attachment</h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <a
                  href={ticket.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#8B0000] hover:text-[#6B0000] font-['Abel',sans-serif]"
                >
                  <Paperclip size={16} />
                  View Attachment
                </a>
              </div>
            </div>
          )}

          {/* ICT Staff Actions */}
          {userRole === 'ict' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-['Abel',sans-serif] text-gray-900">Update Ticket</h4>
              
              <div className="space-y-2">
                <label className="text-sm font-['Abel',sans-serif] text-gray-600">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="font-['Abel',sans-serif]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open" className="font-['Abel',sans-serif]">Open</SelectItem>
                    <SelectItem value="In Progress" className="font-['Abel',sans-serif]">In Progress</SelectItem>
                    <SelectItem value="Resolved" className="font-['Abel',sans-serif]">Resolved</SelectItem>
                    <SelectItem value="Closed" className="font-['Abel',sans-serif]">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateStatus}
                  className="bg-[#8B0000] hover:bg-[#6B0000] text-white flex-1"
                >
                  Update Status
                </Button>
                <Button
                  onClick={onNavigateToChat}
                  variant="outline"
                  className="flex-1"
                >
                  Chat with {ticket.submittedByRole === 'student' ? 'Student' : 'Faculty'}
                </Button>
              </div>
            </div>
          )}

          {/* Student/Faculty Actions */}
          {(userRole === 'student' || userRole === 'faculty') && hasChatMessages && (
            <div className="flex justify-end">
              <Button
                onClick={onNavigateToChat}
                className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
              >
                Chat with ICT Staff
              </Button>
            </div>
          )}

          {/* Show message if chat hasn't been initiated yet */}
          {(userRole === 'student' || userRole === 'faculty') && !hasChatMessages && (
            <div className="text-center py-4 px-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-['Abel',sans-serif]">
                Chat will be available once an ICT staff member initiates the conversation.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}