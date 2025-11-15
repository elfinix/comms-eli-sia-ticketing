import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, User, MessageSquare, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface ChatPageProps {
  currentUserId: string;
  currentUserRole: 'student' | 'faculty' | 'ict';
  ticketId?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

export default function ChatPage({ currentUserId, currentUserRole, ticketId }: ChatPageProps) {
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasCheckedSessionStorage, setHasCheckedSessionStorage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for stored contact ID ONCE on mount
  useEffect(() => {
    const storedContactId = sessionStorage.getItem('chatContactId');
    
    if (storedContactId) {
      console.log('Found stored contact ID on mount:', storedContactId);
      
      // Fetch the specific user
      const fetchAndSelectContact = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', storedContactId)
          .single();
        
        if (!error && data) {
          console.log('Successfully loaded and selecting contact:', data);
          setSelectedContact(data as Contact);
          
          // Also add to contacts list if not already there
          setContacts(prev => {
            const exists = prev.some(c => c.id === data.id);
            if (!exists) {
              console.log('Adding contact to list:', data);
              return [...prev, data as Contact];
            }
            console.log('Contact already in list');
            return prev;
          });
        } else {
          console.error('Error fetching stored contact:', error);
        }
        
        sessionStorage.removeItem('chatContactId');
      };
      
      fetchAndSelectContact();
      setHasCheckedSessionStorage(true);
    } else {
      setHasCheckedSessionStorage(true);
    }
  }, []); // Run only on mount

  // Fetch ICT staff contacts
  useEffect(() => {
    const fetchContacts = async () => {
      // For students and faculty, only show conversations that have messages
      // (meaning ICT staff initiated the conversation)
      if (currentUserRole === 'student' || currentUserRole === 'faculty') {
        // Get unique sender IDs from NON-ARCHIVED messages where current user is the receiver
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('sender_id')
          .eq('receiver_id', currentUserId)
          .is('archived_at', null); // Only show non-archived conversations

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }

        // Get unique ICT staff IDs who have sent messages to this user
        const ictStaffIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];

        if (ictStaffIds.length === 0) {
          setContacts([]);
          return;
        }

        // Fetch those specific ICT staff members
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, department, role')
          .in('id', ictStaffIds)
          .eq('role', 'ict')
          .eq('status', 'active');

        if (error) {
          console.error('Error fetching ICT staff contacts:', error);
        } else {
          setContacts(data as Contact[]);
        }
      } else {
        // For ICT staff, show all contacts as before
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, department, role')
          .eq('role', 'ict')
          .eq('status', 'active');

        if (error) {
          console.error('Error fetching ICT staff contacts:', error);
        } else {
          setContacts(data as Contact[]);
        }
      }
    };

    fetchContacts();
  }, [currentUserId, currentUserRole]);

  // Real-time subscription to update contacts when new messages arrive (for students/faculty)
  useEffect(() => {
    if (currentUserRole !== 'student' && currentUserRole !== 'faculty') return;

    console.log('Setting up global real-time subscription for new contacts...');

    const channel = supabase
      .channel(`new-contacts-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Skip archived messages
          if (newMsg.archived_at) {
            console.log('Skipping archived message in contact update');
            return;
          }

          const senderId = newMsg.sender_id;
          
          // Check if this sender is already in contacts
          const exists = contacts.some(c => c.id === senderId);
          if (exists) {
            console.log('Contact already exists:', senderId);
            return;
          }

          // Fetch the new contact details
          console.log('New message from unknown contact, fetching details:', senderId);
          const { data, error } = await supabase
            .from('users')
            .select('id, name, email, department, role')
            .eq('id', senderId)
            .eq('role', 'ict')
            .eq('status', 'active')
            .single();

          if (!error && data) {
            console.log('Adding new contact to list:', data);
            setContacts(prev => [...prev, data as Contact]);
            
            // Auto-select this new contact
            setSelectedContact(data as Contact);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up global real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUserId, currentUserRole, contacts]);
  
  // Auto-select first contact if nothing is selected (after session storage check)
  useEffect(() => {
    if (hasCheckedSessionStorage && contacts.length > 0 && !selectedContact) {
      console.log('Auto-selecting first contact:', contacts[0]);
      setSelectedContact(contacts[0]);
    }
  }, [contacts, hasCheckedSessionStorage, selectedContact]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.department && contact.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Load messages when contact changes
  useEffect(() => {
    if (!selectedContact) return;

    const fetchMessages = async () => {
      // For students/faculty, exclude archived messages
      let query = supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          created_at
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUserId})`);
      
      // Filter out archived messages for students/faculty
      if (currentUserRole === 'student' || currentUserRole === 'faculty') {
        query = query.is('archived_at', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data as Message[]);
      }
    };

    fetchMessages();

    // Set up realtime subscription for new messages in BOTH directions
    const channel = supabase
      .channel(`chat-${currentUserId}-${selectedContact.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if message is between current user and selected contact
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedContact.id) ||
            (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === currentUserId)
          ) {
            // For students/faculty, skip archived messages
            if ((currentUserRole === 'student' || currentUserRole === 'faculty') && (newMsg as any).archived_at) {
              console.log('Skipping archived message in real-time update');
              return;
            }
            
            setMessages(prev => {
              // Avoid duplicates
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const insertMessage = async () => {
      // Generate conversation ID
      const conversationId = [currentUserId, selectedContact.id].sort().join('-');
      
      // Get current user's name for notification
      const { data: senderData } = await supabase
        .from('users')
        .select('name')
        .eq('id', currentUserId)
        .single();
      
      const senderName = senderData?.name || 'User';

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: selectedContact.id,
          message: newMessage,
          ticket_id: ticketId || null,
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      } else {
        // Create notification for the ICT staff receiver
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: selectedContact.id,
            title: `New Message from ${senderName}`,
            message: newMessage.substring(0, 100) + (newMessage.length > 100 ? '...' : ''),
            type: 'info',
            is_read: false,
          });
        
        if (notifError) {
          console.error('Error creating notification:', notifError);
          // Don't show error to user, message was sent successfully
        }
        
        // Don't add message to local state - let real-time subscription handle it
        setNewMessage('');
      }
    };

    insertMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Helper to get last message preview for contact
  const getContactLastMessage = (contact: Contact) => {
    const lastMsg = messages.find(msg => (msg.sender_id === contact.id || msg.receiver_id === contact.id) && msg.created_at);
    if (!lastMsg) return 'No messages yet';
    
    const preview = lastMsg.message.length > 50 
      ? lastMsg.message.substring(0, 50) + '...' 
      : lastMsg.message;
    return lastMsg.sender_id === currentUserId ? `You: ${preview}` : preview;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
          Chat {ticketId && `- Ticket #${ticketId}`}
        </h2>
        <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
          Message ICT staff for support
        </p>
      </div>

      {/* Chat Container with Sidebar */}
      <div className="flex gap-6 h-[600px]">
        {/* Left Sidebar - Contacts */}
        <div className="w-80 bg-white rounded-xl border-2 border-[#8B0000] shadow-sm flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-['Abel',sans-serif] text-gray-900 mb-3">
              Chat Rooms
            </h3>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ICT Staff"
                className="pl-10 font-['Abel',sans-serif] text-sm"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-['Abel',sans-serif]">
                No contacts found
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#8B0000] flex items-center justify-center flex-shrink-0">
                      <User className="text-white" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-['Abel',sans-serif] text-gray-900">
                        {contact.name}
                      </h4>
                      <p className="text-xs text-gray-500 font-['Abel',sans-serif] truncate">
                        {contact.department || 'ICT Department'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 bg-white rounded-xl border-2 border-[#8B0000] shadow-sm flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center">
                    <User className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-['Abel',sans-serif] text-gray-900">
                      {selectedContact.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-['Abel',sans-serif]">
                      {selectedContact.department || 'ICT Department'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-['Abel',sans-serif]">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%]`}>
                          {msg.sender_id !== currentUserId && (
                            <p className="text-xs font-['Abel',sans-serif] mb-1 text-gray-600 ml-1">
                              {msg.sender_name || 'ICT Staff'} <span className="text-gray-400 ml-2">{formatTime(new Date(msg.created_at))}</span>
                            </p>
                          )}
                          {msg.sender_id === currentUserId && (
                            <p className="text-xs font-['Abel',sans-serif] mb-1 text-gray-600 mr-1 text-right">
                              You <span className="text-gray-400 ml-2">{formatTime(new Date(msg.created_at))}</span>
                            </p>
                          )}
                          <div
                            className={`rounded-2xl p-4 ${
                              msg.sender_id === currentUserId
                                ? 'bg-[#A85C5C] text-white'
                                : 'bg-[#8B0000] text-white'
                            }`}
                          >
                            <p className="font-['Abel',sans-serif] text-sm">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    className="flex-1 font-['Abel',sans-serif] bg-gray-50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-[#8B0000] hover:bg-[#6B0000] text-white px-6 rounded-lg"
                    disabled={!newMessage.trim()}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto text-gray-300 mb-3" size={64} />
                <p className="text-gray-500 font-['Abel',sans-serif]">
                  Select a contact to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}