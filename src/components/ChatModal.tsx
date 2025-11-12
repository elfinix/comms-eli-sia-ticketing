import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, User, Paperclip } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  senderRole: 'student' | 'faculty' | 'ict';
  message: string;
  timestamp: string;
}

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  currentUserRole: 'student' | 'faculty' | 'ict';
  recipientName: string;
}

export default function ChatModal({ open, onOpenChange, ticketId, currentUserRole, recipientName }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ICT Staff',
      senderRole: 'ict',
      message: 'Hello! I\'ve received your ticket. Can you provide more details about the issue?',
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      sender: 'You',
      senderRole: currentUserRole,
      message: 'Yes, the issue started yesterday. The computer won\'t connect to the network.',
      timestamp: '10:35 AM',
    },
    {
      id: '3',
      sender: 'ICT Staff',
      senderRole: 'ict',
      message: 'I see. Have you tried restarting the computer?',
      timestamp: '10:36 AM',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      senderRole: currentUserRole,
      message: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} />
            Chat - Ticket #{ticketId}
          </DialogTitle>
          <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
            Chatting with {recipientName}
          </p>
        </DialogHeader>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender === 'You'
                    ? 'bg-[#8B0000] text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="font-['Abel',sans-serif] text-sm mb-1">
                  {msg.message}
                </p>
                <p
                  className={`text-xs ${
                    msg.sender === 'You' ? 'text-red-100' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 font-['Abel',sans-serif]"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-[#8B0000] hover:bg-[#6B0000] text-white"
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
