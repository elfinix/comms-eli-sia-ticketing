import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, User, Paperclip, Clock, Tag, CheckCircle, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabaseClient';
import ResolutionDialog from './ResolutionDialog';
import AcknowledgmentDialog from './AcknowledgmentDialog';

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
  submittedById?: string; // Add the actual UUID
  submittedByRole: 'student' | 'faculty';
  attachment_url?: string;
  resolution_notes?: string;
  resolution_attachment?: string;
  resolved_at?: string;
}

interface ViewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  userRole: 'student' | 'faculty' | 'ict';
  onNavigateToChat?: (userId?: string) => void;
  onStatusUpdate?: (newStatus: string) => void;
  onAcknowledged?: () => void;
}

export default function ViewTicketModal({ open, onOpenChange, ticket, userRole, onNavigateToChat, onStatusUpdate, onAcknowledged }: ViewTicketModalProps) {
  const [status, setStatus] = useState(ticket?.status || 'Open');
  const [assignedStaffNames, setAssignedStaffNames] = useState<string[]>([]);
  const [hasChatMessages, setHasChatMessages] = useState(false);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [showAcknowledgmentDialog, setShowAcknowledgmentDialog] = useState(false);

  // Sync status when ticket prop changes
  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      console.log('🎫 Ticket Details:', {
        id: ticket.id,
        status: ticket.status,
        resolution_notes: ticket.resolution_notes,
        userRole: userRole
      });
    }
  }, [ticket, userRole]);

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

  const handleUpdateStatus = async () => {
    // Prevent marking as Resolved without resolution notes
    if (status === 'Resolved' && !ticket.resolution_notes) {
      toast.error('Please use "Mark as Resolved" button to provide resolution notes');
      return;
    }

    try {
      // Update status in database
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
        return;
      }

      toast.success('Ticket status updated successfully!');
      onOpenChange(false);
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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

          {/* Resolution Information - Show to all users if ticket is resolved */}
          {ticket.resolution_notes && (ticket.status === 'Resolved' || ticket.status === 'Closed') && (
            <div className="p-5 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="text-green-600" size={24} />
                <h4 className="font-['Josefin_Sans',sans-serif] text-lg text-gray-900">
                  Resolution Details
                </h4>
              </div>
              
              {ticket.resolved_at && (
                <p className="text-sm text-gray-600 font-['Abel',sans-serif] mb-3">
                  Resolved on {formatDate(ticket.resolved_at)}
                </p>
              )}

              <div className="bg-white border border-green-200 rounded-lg p-4 mb-3">
                <p className="font-['Abel',sans-serif] text-gray-700 whitespace-pre-wrap">
                  {ticket.resolution_notes}
                </p>
              </div>

              {ticket.resolution_attachment && (
                <a
                  href={ticket.resolution_attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-700 hover:text-green-800 font-['Abel',sans-serif]"
                >
                  <Paperclip size={16} />
                  View Resolution Attachment
                </a>
              )}
            </div>
          )}

          {/* ICT Staff Actions */}
          {userRole === 'ict' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-['Abel',sans-serif] text-gray-900">Manage Ticket</h4>
              
              {/* Quick Status Buttons for ICT Staff */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowResolutionDialog(true)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  disabled={status === 'Resolved' || status === 'Closed'}
                >
                  <CheckCircle size={18} />
                  Mark as Resolved
                </Button>
                <Button
                  onClick={() => {
                    if (ticket.submittedById && onNavigateToChat) {
                      onNavigateToChat(ticket.submittedById);
                    }
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <FileText size={18} />
                  Chat with {ticket.submittedByRole === 'student' ? 'Student' : 'Faculty'}
                </Button>
              </div>

              {/* Status Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-['Abel',sans-serif] text-gray-600">Or update status manually:</label>
                <div className="flex gap-2">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="font-['Abel',sans-serif] flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open" className="font-['Abel',sans-serif]">Open</SelectItem>
                      <SelectItem value="In Progress" className="font-['Abel',sans-serif]">In Progress</SelectItem>
                      <SelectItem value="Resolved" className="font-['Abel',sans-serif]">Resolved</SelectItem>
                      <SelectItem value="Closed" className="font-['Abel',sans-serif]">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleUpdateStatus}
                    variant="outline"
                    className="px-6"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Student/Faculty Actions */}
          {(userRole === 'student' || userRole === 'faculty') && (
            <div className="space-y-3">
              {/* Show Acknowledge button if ticket is Resolved (not yet Closed) */}
              {status === 'Resolved' && ticket.resolution_notes && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowAcknowledgmentDialog(true)}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    <CheckCircle size={18} />
                    Acknowledge Resolution
                  </Button>
                </div>
              )}

              {/* Show Chat button if chat is available */}
              {hasChatMessages && (
                <div className="flex justify-end">
                  <Button
                    onClick={onNavigateToChat}
                    className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
                  >
                    Chat with ICT Staff
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Show message if chat hasn't been initiated yet */}
          {(userRole === 'student' || userRole === 'faculty') && !hasChatMessages && status !== 'Resolved' && (
            <div className="text-center py-4 px-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-['Abel',sans-serif]">
                Chat will be available once an ICT staff member initiates the conversation.
              </p>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Resolution Dialog */}
      {userRole === 'ict' && ticket && (
        <ResolutionDialog
          open={showResolutionDialog}
          onOpenChange={setShowResolutionDialog}
          ticketId={ticket.id}
          ticketTitle={ticket.title}
          onResolutionSubmitted={() => {
            setShowResolutionDialog(false);
            onOpenChange(false);
            if (onStatusUpdate) {
              onStatusUpdate('Resolved');
            }
          }}
        />
      )}

      {/* Acknowledgment Dialog for Student/Faculty */}
      {(userRole === 'student' || userRole === 'faculty') && ticket && ticket.resolution_notes && (
        <AcknowledgmentDialog
          open={showAcknowledgmentDialog}
          onOpenChange={setShowAcknowledgmentDialog}
          ticketId={ticket.id}
          ticketTitle={ticket.title}
          resolutionNotes={ticket.resolution_notes}
          resolutionAttachment={ticket.resolution_attachment || null}
          resolvedAt={ticket.resolved_at || ''}
          assignedToName={assignedStaffNames.join(', ') || 'ICT Staff'}
          onAcknowledged={() => {
            setShowAcknowledgmentDialog(false);
            onOpenChange(false);
            if (onAcknowledged) {
              onAcknowledged();
            }
          }}
        />
      )}
    </Dialog>
  );
}