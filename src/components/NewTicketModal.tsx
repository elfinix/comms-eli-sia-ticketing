import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'student' | 'faculty';
  onTicketCreated?: () => void; // Callback to refresh tickets
}

export default function NewTicketModal({ open, onOpenChange, userRole, onTicketCreated }: NewTicketModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    urgency: '',
    description: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map display names to database values
  const allCategories = [
    { label: 'Hardware Issue', value: 'Hardware' },
    { label: 'Software Issue', value: 'Software' },
    { label: 'Network/Internet', value: 'Network' },
    { label: 'Account Access', value: 'Account' },
  ];

  // Students can only select Network/Internet and Account Access
  const studentCategories = [
    { label: 'Network/Internet', value: 'Network' },
    { label: 'Account Access', value: 'Account' },
  ];

  // Use student-specific categories for students, all categories for faculty
  const categories = userRole === 'student' ? studentCategories : allCategories;

  const urgencies = ['Low', 'Medium', 'High'];

  // Map category to ICT department
  const getDepartmentByCategory = (category: string): string => {
    return `ICT - ${category}`;
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.urgency || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate ticket ID in format TKT-YYMM-NNN with robust sequence handling
      const now = new Date();
      const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Get the highest ticket number for this month to avoid duplicates
      const { data: existingTickets, error: fetchError } = await supabase
        .from('tickets')
        .select('id')
        .like('id', `TKT-${yearMonth}-%`)
        .order('id', { ascending: false })
        .limit(1);

      let sequenceNumber = 1;
      if (existingTickets && existingTickets.length > 0) {
        // Extract the sequence number from the last ticket ID
        const lastId = existingTickets[0].id;
        const lastSequence = parseInt(lastId.split('-')[2]);
        sequenceNumber = lastSequence + 1;
      }

      const ticketId = `TKT-${yearMonth}-${String(sequenceNumber).padStart(3, '0')}`;

      // Upload attachment if exists
      let attachmentUrl: string | null = null;
      if (attachment) {
        console.log('📤 Uploading file via backend...');
        
        // Get current user session for auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Session expired. Please login again.');
          setIsSubmitting(false);
          return;
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', attachment);
        formData.append('folder', `${user.id}`);
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
          setIsSubmitting(false);
          return;
        }

        const uploadResult = await uploadResponse.json();
        console.log('✅ File uploaded successfully:', uploadResult);
        attachmentUrl = uploadResult.url;
      }

      // Create the ticket WITHOUT assignment (Admin will assign later)
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert([{
          id: ticketId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          urgency: formData.urgency,
          status: 'Open',
          submitted_by: user.id,
          assigned_to: null,  // No assignment yet - Admin will assign
          attachment_url: attachmentUrl,
        }])
        .select()
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        toast.error('Failed to create ticket. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Notify all administrators about the new ticket
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0 && !adminsError) {
        const adminNotifications = admins.map(admin => ({
          user_id: admin.id,
          title: 'New Ticket Submitted',
          message: `New ${formData.category} ticket "${formData.title}" submitted by ${userRole === 'student' ? 'a student' : 'faculty'}.`,
          type: 'info' as const,
          is_read: false,
          ticket_id: ticketId,
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(adminNotifications);

        if (notifError) {
          console.error('Error creating admin notifications:', notifError);
        }
      }

      // Success!
      toast.success('Ticket submitted successfully!', {
        description: 'Your ticket will be reviewed by an administrator.',
      });
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        urgency: '',
        description: '',
      });
      setAttachment(null);
      onOpenChange(false);
      if (onTicketCreated) {
        onTicketCreated();
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Ticket</DialogTitle>
          <DialogDescription>
            Describe your technical issue and we'll assist you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="font-['Abel',sans-serif]">
              Ticket Title <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief summary of the issue"
              className="font-['Abel',sans-serif]"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="font-['Abel',sans-serif]">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="font-['Abel',sans-serif]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value} className="font-['Abel',sans-serif]">
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label className="font-['Abel',sans-serif]">
              Urgency <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
              <SelectTrigger className="font-['Abel',sans-serif]">
                <SelectValue placeholder="Select urgency" />
              </SelectTrigger>
              <SelectContent>
                {urgencies.map((urgency) => (
                  <SelectItem key={urgency} value={urgency} className="font-['Abel',sans-serif]">
                    {urgency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="font-['Abel',sans-serif]">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed information about the issue..."
              className="font-['Abel',sans-serif] min-h-[120px]"
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label className="font-['Abel',sans-serif]">Attachment (Optional)</Label>
            {!attachment ? (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400 transition-colors">
                <Upload size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500 font-['Abel',sans-serif]">
                  Click to upload screenshot or file
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-sm font-['Abel',sans-serif] text-gray-700 truncate">
                  {attachment.name}
                </span>
                <button
                  onClick={removeAttachment}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}