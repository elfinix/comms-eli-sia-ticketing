import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, User, MessageSquare, Search } from 'lucide-react';
import { Badge } from './ui/badge';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface ChatPageICTProps {
  currentUserId: string;
  currentUserRole: 'ict';
  ticketId?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty';
  department?: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  ticket_id?: string;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
}

export default function ChatPageICT({ currentUserId, currentUserRole, ticketId }: ChatPageICTProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCheckedSessionStorage, setHasCheckedSessionStorage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch contacts who have conversations with this ICT staff
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      
      // Get all chat messages involving this ICT staff
      const { data: chatData, error: chatError } = await supabase
        .from('chat_messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);
      
      if (chatError) {
        console.error('Error fetching chat messages:', chatError);
        toast.error('Failed to load conversations');
        setLoading(false);
        return;
      }
      
      // Get unique user IDs (excluding current user)
      const userIds = new Set<string>();
      chatData.forEach(msg => {
        if (msg.sender_id !== currentUserId) userIds.add(msg.sender_id);
        if (msg.receiver_id !== currentUserId) userIds.add(msg.receiver_id);
      });
      
      if (userIds.size === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }
      
      // Fetch user details for these IDs
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', Array.from(userIds))
        .in('role', ['student', 'faculty']);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast.error('Failed to load contacts');
        setLoading(false);
        return;
      }
      
      console.log('Fetched contacts:', usersData);
      setContacts(usersData as Contact[]);
      setLoading(false);
    };
    
    if (currentUserId) {
      fetchContacts();
    }
  }, [currentUserId]);

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
  
  // Auto-select first contact if nothing is selected
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
    const fetchMessages = async () => {
      if (!selectedContact) return;
      
      // Fetch messages between current user and selected contact
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
        return;
      }
      
      // Enrich messages with sender names
      const enrichedMessages = data.map(msg => ({
        ...msg,
        sender_name: msg.sender_id === currentUserId ? 'You' : selectedContact.name,
        sender_role: msg.sender_id === currentUserId ? currentUserRole : selectedContact.role,
      }));
      
      setMessages(enrichedMessages);
    };
    
    fetchMessages();
    
    // Set up real-time subscription for new messages - listen to ALL inserts and filter client-side
    const channel = supabase
      .channel(`chat-${currentUserId}-${selectedContact?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Filter client-side to only show messages between current user and selected contact
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedContact.id) ||
            (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === currentUserId)
          ) {
            setMessages(prev => {
              // Avoid duplicates
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, {
                ...newMsg,
                sender_name: newMsg.sender_id === currentUserId ? 'You' : selectedContact.name,
                sender_role: newMsg.sender_id === currentUserId ? currentUserRole : selectedContact.role,
              }];
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    // Get current user's name for notification
    const { data: senderData } = await supabase
      .from('users')
      .select('name')
      .eq('id', currentUserId)
      .single();
    
    const senderName = senderData?.name || 'ICT Staff';
    
    // Insert message into database
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: selectedContact.id,
        message: newMessage.trim(),
        ticket_id: ticketId || null,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return;
    }
    
    // Create notification for the receiver (student/faculty)
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: selectedContact.id,
        title: `New Message from ${senderName}`,
        message: newMessage.trim().substring(0, 100) + (newMessage.trim().length > 100 ? '...' : ''),
        type: 'info',
        is_read: false,
      });
    
    if (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't show error to user, message was sent successfully
    }
    
    setNewMessage('');
    // Message will be added via real-time subscription
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Preview messages for each contact
  const [contactPreviews, setContactPreviews] = useState<Record<string, string>>({});
  
  // Batch load all contact previews in ONE query - MUCH faster!
  useEffect(() => {
    if (contacts.length === 0) return;
    
    const loadAllPreviews = async () => {
      // Fetch ALL messages involving this ICT staff in one query
      const { data: allMessages, error } = await supabase
        .from('chat_messages')
        .select('sender_id, receiver_id, message, created_at')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });
      
      if (error || !allMessages) {
        console.error('Error fetching message previews:', error);
        return;
      }
      
      // Build a map of last message for each contact
      const previewMap: Record<string, string> = {};
      
      contacts.forEach(contact => {
        // Find the first (most recent) message for this contact
        const lastMessage = allMessages.find(
          msg => 
            (msg.sender_id === currentUserId && msg.receiver_id === contact.id) ||
            (msg.sender_id === contact.id && msg.receiver_id === currentUserId)
        );
        
        if (lastMessage) {
          const preview = lastMessage.message.length > 40 
            ? lastMessage.message.substring(0, 40) + '...' 
            : lastMessage.message;
          previewMap[contact.id] = preview;
        } else {
          previewMap[contact.id] = 'No messages';
        }
      });
      
      // Set all previews at once
      setContactPreviews(previewMap);
    };
    
    loadAllPreviews();
    
    // Subscribe to realtime updates for instant preview updates
    const channel = supabase
      .channel('preview-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId})`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Find which contact this message belongs to
          const contactId = newMsg.sender_id === currentUserId ? newMsg.receiver_id : newMsg.sender_id;
          
          // Update the preview for this contact instantly
          const preview = newMsg.message.length > 40 
            ? newMsg.message.substring(0, 40) + '...' 
            : newMsg.message;
          
          setContactPreviews(prev => ({ ...prev, [contactId]: preview }));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [contacts, currentUserId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
          Chat {ticketId && `- Ticket #${ticketId}`}
        </h2>
        <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
          Communicate with students and faculty
        </p>
      </div>

      {/* Chat Container with Sidebar */}
      <div className="flex gap-6 h-[600px]">
        {/* Left Sidebar - Contacts */}
        <div className="w-80 bg-white rounded-xl border-2 border-[#8B0000] shadow-sm flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-['Abel',sans-serif] text-gray-900 mb-3">
              Conversations
            </h3>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users"
                className="pl-10 font-['Abel',sans-serif] text-sm"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-['Abel',sans-serif]">
                No conversations yet
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      contact.role === 'student' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      <User className="text-white" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-['Abel',sans-serif] text-gray-900 truncate">
                          {contact.name}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            contact.role === 'student' 
                              ? 'border-blue-500 text-blue-700' 
                              : 'border-green-500 text-green-700'
                          }`}
                        >
                          {contact.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 font-['Abel',sans-serif] truncate">
                        {contactPreviews[contact.id] || 'No messages'}
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedContact.role === 'student' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    <User className="text-white" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-['Abel',sans-serif] text-gray-900">
                        {selectedContact.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          selectedContact.role === 'student' 
                            ? 'border-blue-500 text-blue-700' 
                            : 'border-green-500 text-green-700'
                        }`}
                      >
                        {selectedContact.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-['Abel',sans-serif]">
                      {selectedContact.department}
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
                              {msg.sender_name} <span className="text-gray-400 ml-2">{formatTime(msg.created_at)}</span>
                            </p>
                          )}
                          {msg.sender_id === currentUserId && (
                            <p className="text-xs font-['Abel',sans-serif] mb-1 text-gray-600 mr-1 text-right">
                              You <span className="text-gray-400 ml-2">{formatTime(msg.created_at)}</span>
                            </p>
                          )}
                          <div
                            className={`rounded-2xl p-4 ${
                              msg.sender_id === currentUserId
                                ? 'bg-[#8B0000] text-white'
                                : 'bg-white border-2 border-gray-200 text-gray-900'
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
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}