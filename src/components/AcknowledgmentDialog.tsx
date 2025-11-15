import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { CheckCircle, FileText, Download, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabaseClient';
import { Separator } from './ui/separator';

interface AcknowledgmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketTitle: string;
  resolutionNotes: string;
  resolutionAttachment: string | null;
  resolvedAt: string;
  assignedToName: string;
  onAcknowledged: () => void;
}

export default function AcknowledgmentDialog({
  open,
  onOpenChange,
  ticketId,
  ticketTitle,
  resolutionNotes,
  resolutionAttachment,
  resolvedAt,
  assignedToName,
  onAcknowledged
}: AcknowledgmentDialogProps) {

  const handleAcknowledge = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to acknowledge a ticket');
        return;
      }

      // Update ticket status to Closed and add acknowledgment info
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'Closed',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Error acknowledging ticket:', updateError);
        toast.error('Failed to acknowledge ticket');
        return;
      }

      // Get assigned ICT staff IDs to send notifications
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('assigned_to, submitted_by')
        .eq('id', ticketId)
        .single();

      // Get submitter info for notification message
      const { data: submitterData } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', ticketData?.submitted_by)
        .single();

      const submitterName = submitterData?.name || 'User';
      const submitterRole = submitterData?.role || 'student';

      // Send notification to ALL assigned ICT Staff
      if (ticketData?.assigned_to) {
        let staffIds: string[] = [];
        
        // Parse assigned_to (could be array or single UUID)
        if (Array.isArray(ticketData.assigned_to)) {
          staffIds = ticketData.assigned_to;
        } else if (typeof ticketData.assigned_to === 'string') {
          try {
            const parsed = JSON.parse(ticketData.assigned_to);
            staffIds = Array.isArray(parsed) ? parsed : [ticketData.assigned_to];
          } catch {
            staffIds = [ticketData.assigned_to];
          }
        }

        // Create notifications for all assigned ICT staff
        const notifications = staffIds.map(staffId => ({
          user_id: staffId,
          title: 'Resolution Acknowledged ✅',
          message: `${submitterName} (${submitterRole}) has acknowledged your resolution for ticket "${ticketTitle}". The ticket is now closed.`,
          type: 'success',
          ticket_id: ticketId,
        }));

        if (notifications.length > 0) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);
          
          if (notifError) {
            console.error('Error creating notifications:', notifError);
          } else {
            console.log(`✅ Sent acknowledgment notifications to ${notifications.length} ICT staff member(s)`);
          }
        }
      }

      toast.success('Ticket Acknowledged', {
        description: 'Thank you for confirming the resolution!'
      });

      onOpenChange(false);
      onAcknowledged();
    } catch (error) {
      console.error('Error acknowledging ticket:', error);
      toast.error('Failed to acknowledge ticket. Please try again.');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-['Josefin_Sans',sans-serif]">
            <CheckCircle className="text-green-600" size={24} />
            Acknowledge Resolution
          </DialogTitle>
          <DialogDescription className="font-['Abel',sans-serif]">
            Please review the resolution details before acknowledging this ticket.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Ticket Title */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-['Abel',sans-serif] mb-1">Ticket</p>
            <p className="font-['Josefin_Sans',sans-serif] text-gray-900">{ticketTitle}</p>
          </div>

          {/* Resolved By & Date */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-['Abel',sans-serif] mb-1">Resolved By</p>
              <p className="text-sm font-['Josefin_Sans',sans-serif] text-blue-900">{assignedToName}</p>
            </div>
            <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={12} className="text-blue-700" />
                <p className="text-xs text-blue-700 font-['Abel',sans-serif]">Resolved On</p>
              </div>
              <p className="text-sm font-['Josefin_Sans',sans-serif] text-blue-900">
                {formatDate(resolvedAt)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Resolution Notes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-gray-600" />
              <label className="text-sm font-['Josefin_Sans',sans-serif] text-gray-700">
                Resolution Details
              </label>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-['Abel',sans-serif] text-gray-800 whitespace-pre-wrap">
                {resolutionNotes}
              </p>
            </div>
          </div>

          {/* Resolution Attachment */}
          {resolutionAttachment && (
            <div>
              <label className="text-sm font-['Josefin_Sans',sans-serif] text-gray-700 mb-2 block">
                Attachment
              </label>
              <a
                href={resolutionAttachment}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Download size={18} className="text-green-700" />
                <span className="text-sm font-['Abel',sans-serif] text-green-700">
                  View Resolution Attachment
                </span>
              </a>
            </div>
          )}

          {/* Info Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-['Abel',sans-serif] text-amber-800">
              <strong>Note:</strong> By acknowledging this resolution, you confirm that the issue has been resolved to your satisfaction. The ticket will be marked as <strong>Closed</strong>.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="font-['Abel',sans-serif]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcknowledge}
            className="bg-green-600 hover:bg-green-700 text-white font-['Abel',sans-serif]"
          >
            <CheckCircle size={18} className="mr-2" />
            Acknowledge Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}