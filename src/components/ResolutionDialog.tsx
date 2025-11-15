import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { CheckCircle, Upload, X, FileText, Paperclip } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabaseClient';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketTitle: string;
  onResolutionSubmitted: () => void;
}

export default function ResolutionDialog({ 
  open, 
  onOpenChange, 
  ticketId, 
  ticketTitle,
  onResolutionSubmitted 
}: ResolutionDialogProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setAttachmentFile(file);
    }
  };

  const handleRemoveFile = () => {
    setAttachmentFile(null);
  };

  const handleSubmitResolution = async () => {
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }

    setUploading(true);

    try {
      let attachmentUrl: string | null = null;

      // Upload attachment if provided - Use backend endpoint to bypass RLS
      if (attachmentFile) {
        console.log('📤 Uploading file via backend...');
        
        // Get current user session for auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Session expired. Please login again.');
          setUploading(false);
          return;
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', attachmentFile);
        formData.append('folder', 'resolution-attachments');
        formData.append('ticketId', ticketId);

        // Upload via backend (bypasses RLS using service role)
        const uploadResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-0488e420/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('❌ Upload failed:', errorData);
          toast.error(`Failed to upload attachment: ${errorData.error || 'Unknown error'}`);
          setUploading(false);
          return;
        }

        const uploadResult = await uploadResponse.json();
        console.log('✅ File uploaded successfully:', uploadResult);
        attachmentUrl = uploadResult.url;
      }

      // Update ticket with resolution notes, attachment, and status
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'Resolved',
          resolution_notes: resolutionNotes,
          resolution_attachment: attachmentUrl,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (updateError) {
        console.error('Error updating ticket:', updateError);
        toast.error('Failed to submit resolution');
        setUploading(false);
        return;
      }

      // Get ticket data for notifications and archiving
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('submitted_by')
        .eq('id', ticketId)
        .single();

      // Get current ICT staff user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Archive all chat messages between ICT staff and the ticket submitter
      if (ticketData?.submitted_by && currentUser?.id) {
        console.log('🗄️ Archiving chat messages for resolved ticket...');
        
        // Archive messages in BOTH directions (ICT -> User and User -> ICT)
        const { error: archiveError } = await supabase
          .from('chat_messages')
          .update({
            archived_at: new Date().toISOString(),
            archived_by: currentUser.id,
            ticket_id: ticketId
          })
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${ticketData.submitted_by}),and(sender_id.eq.${ticketData.submitted_by},receiver_id.eq.${currentUser.id})`)
          .is('archived_at', null); // Only archive messages that aren't already archived

        if (archiveError) {
          console.error('❌ Error archiving chat messages:', archiveError);
          // Don't fail the resolution if archiving fails, just log it
        } else {
          console.log('✅ Chat messages archived successfully');
        }
      }

      if (ticketData?.submitted_by) {
        // Check if user has ticket_updates notifications enabled
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('ticket_updates')
          .eq('user_id', ticketData.submitted_by)
          .single();

        // Only create notification if user hasn't disabled ticket updates (default to true)
        if (preferences?.ticket_updates !== false) {
          await supabase.from('notifications').insert({
            user_id: ticketData.submitted_by,
            title: 'Ticket Resolved',
            message: `Your ticket "${ticketTitle}" has been resolved. Check the resolution notes for details.`,
            type: 'success',
            ticket_id: ticketId,
          });
        }
      }

      toast.success('Resolution submitted successfully!');
      setResolutionNotes('');
      setAttachmentFile(null);
      onOpenChange(false);
      onResolutionSubmitted();
    } catch (error) {
      console.error('Error submitting resolution:', error);
      toast.error('Failed to submit resolution. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setResolutionNotes('');
    setAttachmentFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-['Josefin_Sans',sans-serif]">
            <CheckCircle className="text-green-600" size={24} />
            Mark Ticket as Resolved
          </DialogTitle>
          <DialogDescription className="font-['Abel',sans-serif]">
            Document how you resolved this ticket. This information will be shared with the ticket submitter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Ticket Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <FileText className="text-gray-400 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500 font-['Abel',sans-serif] mb-1">Ticket #{ticketId}</p>
                <p className="font-['Abel',sans-serif] text-gray-900">{ticketTitle}</p>
              </div>
            </div>
          </div>

          {/* Resolution Notes */}
          <div className="space-y-2">
            <Label htmlFor="resolution-notes" className="font-['Abel',sans-serif]">
              Resolution Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="resolution-notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe the steps taken to resolve this issue...&#10;&#10;Example:&#10;- Diagnosed the issue as outdated drivers&#10;- Updated network adapter drivers to version 2.3.1&#10;- Tested connection - working properly&#10;- Advised user on preventive maintenance"
              className="min-h-[180px] font-['Abel',sans-serif] resize-none"
              required
            />
            <p className="text-xs text-gray-500 font-['Abel',sans-serif]">
              Be specific about the problem and solution for future reference
            </p>
          </div>

          {/* Attachment Upload */}
          <div className="space-y-2">
            <Label htmlFor="resolution-attachment" className="font-['Abel',sans-serif]">
              Resolution Attachment (Optional)
            </Label>
            
            {!attachmentFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#8B0000] transition-colors">
                <input
                  id="resolution-attachment"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="resolution-attachment"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="text-gray-400" size={32} />
                  <div>
                    <p className="font-['Abel',sans-serif] text-gray-700">
                      Click to upload attachment
                    </p>
                    <p className="text-xs text-gray-500 font-['Abel',sans-serif] mt-1">
                      Screenshots, logs, or documentation (Max 10MB)
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Paperclip className="text-green-600" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="font-['Abel',sans-serif] text-gray-900 truncate">
                    {attachmentFile.name}
                  </p>
                  <p className="text-xs text-gray-500 font-['Abel',sans-serif]">
                    {(attachmentFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={18} />
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-500 font-['Abel',sans-serif]">
              Accepted formats: JPG, PNG, PDF, DOC, DOCX, TXT
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={uploading}
            className="font-['Abel',sans-serif]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmitResolution}
            disabled={uploading || !resolutionNotes.trim()}
            className="bg-green-600 hover:bg-green-700 text-white font-['Abel',sans-serif] gap-2"
          >
            {uploading ? (
              <>
                <span className="animate-spin">⏳</span>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Submit Resolution
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}