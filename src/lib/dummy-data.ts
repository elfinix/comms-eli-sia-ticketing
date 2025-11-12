// Dummy data for IT Helpdesk Ticketing System

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'ict' | 'admin';
  avatar?: string;
  department?: string;
  status: 'active' | 'inactive';
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: 'Hardware' | 'Software' | 'Network' | 'Account';
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  submittedBy: string;
  submittedByName: string;
  submittedByRole: 'student' | 'faculty';
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes?: string[];
  attachments?: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string; // Format: "student-1_ict-1" (always sorted alphabetically by userId)
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'faculty' | 'ict';
  receiverId: string;
  receiverName: string;
  message: string;
  timestamp: Date;
  ticketId?: string; // Optional: if this message is related to a specific ticket
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
}

// Dummy Users
export const dummyUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Administrator',
    email: 'admin@lpu.edu.ph',
    role: 'admin',
    department: 'Administration',
    status: 'active',
  },
  {
    id: 'ict-1',
    name: 'Mark Villanueva',
    email: 'ict.staff1@lpu.edu.ph',
    role: 'ict',
    department: 'ICT Department',
    status: 'active',
  },
  {
    id: 'ict-2',
    name: 'Lisa Ramos',
    email: 'ict.staff2@lpu.edu.ph',
    role: 'ict',
    department: 'ICT Department',
    status: 'active',
  },
  {
    id: 'faculty-1',
    name: 'Prof. Ana Garcia',
    email: 'prof.garcia@lpu.edu.ph',
    role: 'faculty',
    department: 'Computer Science Department',
    status: 'active',
  },
  {
    id: 'faculty-2',
    name: 'Prof. Ramon Lopez',
    email: 'prof.lopez@lpu.edu.ph',
    role: 'faculty',
    department: 'Engineering Department',
    status: 'active',
  },
  {
    id: 'student-1',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@lpu.edu.ph',
    role: 'student',
    department: 'BS Computer Science',
    status: 'active',
  },
  {
    id: 'student-2',
    name: 'Maria Santos',
    email: 'maria.santos@lpu.edu.ph',
    role: 'student',
    department: 'BS Information Technology',
    status: 'active',
  },
  {
    id: 'student-3',
    name: 'Pedro Reyes',
    email: 'pedro.reyes@lpu.edu.ph',
    role: 'student',
    department: 'BS Accountancy',
    status: 'active',
  },
];

// Dummy Tickets
export const dummyTickets: Ticket[] = [
  {
    id: 'TKT-2025-001',
    title: 'Cannot access LMS Portal',
    description: 'I am unable to login to the Learning Management System. Getting error "Invalid credentials" even with correct password.',
    category: 'Account',
    urgency: 'High',
    status: 'In Progress',
    submittedBy: 'student-1',
    submittedByName: 'Juan Dela Cruz',
    submittedByRole: 'student',
    assignedTo: 'ict-1',
    assignedToName: 'Mark Villanueva',
    createdAt: new Date('2025-01-10T08:30:00').toISOString(),
    updatedAt: new Date('2025-01-10T10:15:00').toISOString(),
    notes: ['Verified user credentials', 'Resetting password and checking account status'],
  },
  {
    id: 'TKT-2025-002',
    title: 'Projector not working in Room 305',
    description: 'The projector in Room 305 is not displaying any output. Tried different cables but still not working.',
    category: 'Hardware',
    urgency: 'High',
    status: 'Open',
    submittedBy: 'faculty-1',
    submittedByName: 'Prof. Ana Garcia',
    submittedByRole: 'faculty',
    assignedTo: 'ict-2',
    assignedToName: 'Lisa Ramos',
    createdAt: new Date('2025-01-10T09:00:00').toISOString(),
    updatedAt: new Date('2025-01-10T09:00:00').toISOString(),
  },
  {
    id: 'TKT-2025-003',
    title: 'Slow internet connection in Library',
    description: 'Internet connection in the library is extremely slow. Cannot load research materials.',
    category: 'Network',
    urgency: 'Medium',
    status: 'Resolved',
    submittedBy: 'student-2',
    submittedByName: 'Maria Santos',
    submittedByRole: 'student',
    assignedTo: 'ict-1',
    assignedToName: 'Mark Villanueva',
    createdAt: new Date('2025-01-09T14:20:00').toISOString(),
    updatedAt: new Date('2025-01-09T16:45:00').toISOString(),
    resolvedAt: new Date('2025-01-09T16:45:00').toISOString(),
    notes: ['Checked network configuration', 'Resolved by resetting router and optimizing bandwidth allocation'],
  },
  {
    id: 'TKT-2025-004',
    title: 'Microsoft Office not activating',
    description: 'Microsoft Office 365 showing "Product Activation Required" message on my work laptop.',
    category: 'Software',
    urgency: 'Medium',
    status: 'In Progress',
    submittedBy: 'faculty-2',
    submittedByName: 'Prof. Ramon Lopez',
    submittedByRole: 'faculty',
    assignedTo: 'ict-2',
    assignedToName: 'Lisa Ramos',
    createdAt: new Date('2025-01-10T11:00:00').toISOString(),
    updatedAt: new Date('2025-01-10T11:30:00').toISOString(),
    notes: ['Checking Office 365 license allocation'],
  },
  {
    id: 'TKT-2025-005',
    title: 'Email not receiving attachments',
    description: 'Cannot receive email attachments larger than 5MB. They appear as broken links.',
    category: 'Account',
    urgency: 'Low',
    status: 'Open',
    submittedBy: 'faculty-1',
    submittedByName: 'Prof. Ana Garcia',
    submittedByRole: 'faculty',
    createdAt: new Date('2025-01-10T13:15:00').toISOString(),
    updatedAt: new Date('2025-01-10T13:15:00').toISOString(),
  },
  {
    id: 'TKT-2025-006',
    title: 'Computer lab PC not booting',
    description: 'PC #12 in Computer Lab A is stuck on boot screen. Shows "Operating System Not Found" error.',
    category: 'Hardware',
    urgency: 'High',
    status: 'Resolved',
    submittedBy: 'faculty-2',
    submittedByName: 'Prof. Ramon Lopez',
    submittedByRole: 'faculty',
    assignedTo: 'ict-1',
    assignedToName: 'Mark Villanueva',
    createdAt: new Date('2025-01-08T10:00:00').toISOString(),
    updatedAt: new Date('2025-01-08T14:30:00').toISOString(),
    resolvedAt: new Date('2025-01-08T14:30:00').toISOString(),
    notes: ['Checked hardware connections', 'Reinstalled operating system and restored to working condition'],
  },
  // Additional tickets for student-1 to show in history
  {
    id: 'TKT-2025-007',
    title: 'WiFi connection issues in Room 201',
    description: 'Unable to connect to WiFi network in Room 201. Other students having same issue.',
    category: 'Network',
    urgency: 'High',
    status: 'Resolved',
    submittedBy: 'student-1',
    submittedByName: 'Juan Dela Cruz',
    submittedByRole: 'student',
    assignedTo: 'ict-1',
    assignedToName: 'Mark Villanueva',
    createdAt: new Date('2025-01-05T09:00:00').toISOString(),
    updatedAt: new Date('2025-01-05T15:30:00').toISOString(),
    resolvedAt: new Date('2025-01-05T15:30:00').toISOString(),
    notes: ['Investigated network issue', 'Replaced faulty access point in Room 201'],
  },
  {
    id: 'TKT-2025-008',
    title: 'Student portal password reset',
    description: 'Need to reset my student portal password. Forgot my current password.',
    category: 'Account',
    urgency: 'Medium',
    status: 'Closed',
    submittedBy: 'student-1',
    submittedByName: 'Juan Dela Cruz',
    submittedByRole: 'student',
    assignedTo: 'ict-2',
    assignedToName: 'Lisa Ramos',
    createdAt: new Date('2025-01-03T11:00:00').toISOString(),
    updatedAt: new Date('2025-01-03T12:00:00').toISOString(),
    resolvedAt: new Date('2025-01-03T12:00:00').toISOString(),
    notes: ['Verified student identity', 'Password reset link sent to registered email'],
  },
  {
    id: 'TKT-2025-009',
    title: 'Cannot print from library computer',
    description: 'Printer queue not showing available printers in the library.',
    category: 'Hardware',
    urgency: 'Low',
    status: 'Resolved',
    submittedBy: 'student-1',
    submittedByName: 'Juan Dela Cruz',
    submittedByRole: 'student',
    assignedTo: 'ict-1',
    assignedToName: 'Mark Villanueva',
    createdAt: new Date('2024-12-28T14:30:00').toISOString(),
    updatedAt: new Date('2024-12-28T16:00:00').toISOString(),
    resolvedAt: new Date('2024-12-28T16:00:00').toISOString(),
    notes: ['Reinstalled printer drivers', 'Added network printers to print queue'],
  },
  {
    id: 'TKT-2025-010',
    title: 'Email storage quota exceeded',
    description: 'Getting error message that my email storage is full. Need to increase quota or clean up.',
    category: 'Account',
    urgency: 'Low',
    status: 'Closed',
    submittedBy: 'student-1',
    submittedByName: 'Juan Dela Cruz',
    submittedByRole: 'student',
    assignedTo: 'ict-2',
    assignedToName: 'Lisa Ramos',
    createdAt: new Date('2024-12-20T10:00:00').toISOString(),
    updatedAt: new Date('2024-12-20T14:00:00').toISOString(),
    resolvedAt: new Date('2024-12-20T14:00:00').toISOString(),
    notes: ['Archived old emails', 'Increased mailbox quota to 10GB'],
  },
];

// Dummy Notifications
export const dummyNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'admin-1',
    title: 'New Ticket Submitted',
    message: 'A new high-priority ticket has been submitted by Prof. Roberto Garcia',
    type: 'warning',
    read: false,
    createdAt: new Date('2025-01-10T09:00:00'),
  },
  {
    id: 'notif-2',
    userId: 'student-1',
    title: 'Ticket Status Update',
    message: 'Your ticket TKT-2025-001 is now In Progress',
    type: 'info',
    read: false,
    createdAt: new Date('2025-01-10T10:15:00'),
  },
  {
    id: 'notif-3',
    userId: 'faculty-1',
    title: 'Ticket Assigned',
    message: 'Your ticket TKT-2025-002 has been assigned to Sarah Cruz',
    type: 'success',
    read: true,
    createdAt: new Date('2025-01-10T09:05:00'),
  },
];

// Helper functions
export const getTicketsByUser = (userId: string): Ticket[] => {
  return dummyTickets.filter(ticket => ticket.submittedBy === userId);
};

export const getTicketsByAssignee = (userId: string): Ticket[] => {
  return dummyTickets.filter(ticket => ticket.assignedTo === userId);
};

export const getTicketStats = () => {
  const total = dummyTickets.length;
  const open = dummyTickets.filter(t => t.status === 'Open').length;
  const inProgress = dummyTickets.filter(t => t.status === 'In Progress').length;
  const resolved = dummyTickets.filter(t => t.status === 'Resolved').length;
  
  return { total, open, inProgress, resolved, active: open + inProgress };
};

export const getUsersByRole = (role: string) => {
  return dummyUsers.filter(user => user.role === role);
};

// Helper function to create conversation ID (always alphabetically sorted)
export const createConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

// Dummy Chat Messages
export const dummyChatMessages: ChatMessage[] = [
  // Conversation between student-1 (Juan) and ict-1 (Mark Villanueva)
  {
    id: 'msg-1',
    conversationId: createConversationId('student-1', 'ict-1'),
    senderId: 'student-1',
    senderName: 'Juan Dela Cruz',
    senderRole: 'student',
    receiverId: 'ict-1',
    receiverName: 'Mark Villanueva',
    message: 'Hi, I submitted a ticket about LMS access issues. Any updates?',
    timestamp: new Date('2025-01-10T09:00:00'),
    ticketId: 'TKT-2025-001',
  },
  {
    id: 'msg-2',
    conversationId: createConversationId('student-1', 'ict-1'),
    senderId: 'ict-1',
    senderName: 'Mark Villanueva',
    senderRole: 'ict',
    receiverId: 'student-1',
    receiverName: 'Juan Dela Cruz',
    message: 'Hello Juan! Yes, I\'m currently working on your ticket. I\'ve verified your credentials and will reset your password shortly.',
    timestamp: new Date('2025-01-10T09:15:00'),
    ticketId: 'TKT-2025-001',
  },
  {
    id: 'msg-3',
    conversationId: createConversationId('student-1', 'ict-1'),
    senderId: 'student-1',
    senderName: 'Juan Dela Cruz',
    senderRole: 'student',
    receiverId: 'ict-1',
    receiverName: 'Mark Villanueva',
    message: 'Thank you! How long will it take approximately?',
    timestamp: new Date('2025-01-10T09:20:00'),
    ticketId: 'TKT-2025-001',
  },
  {
    id: 'msg-4',
    conversationId: createConversationId('student-1', 'ict-1'),
    senderId: 'ict-1',
    senderName: 'Mark Villanueva',
    senderRole: 'ict',
    receiverId: 'student-1',
    receiverName: 'Juan Dela Cruz',
    message: 'Should be done within the next 30 minutes. You\'ll receive an email with your temporary password.',
    timestamp: new Date('2025-01-10T09:25:00'),
    ticketId: 'TKT-2025-001',
  },
  {
    id: 'msg-5',
    conversationId: createConversationId('student-1', 'ict-1'),
    senderId: 'student-1',
    senderName: 'Juan Dela Cruz',
    senderRole: 'student',
    receiverId: 'ict-1',
    receiverName: 'Mark Villanueva',
    message: 'Perfect, thank you so much!',
    timestamp: new Date('2025-01-10T09:30:00'),
    ticketId: 'TKT-2025-001',
  },
  // Earlier conversation about WiFi issues (resolved ticket)
  {
    id: 'msg-6',
    conversationId: createConversationId('student-1', 'ict-1'),
    senderId: 'student-1',
    senderName: 'Juan Dela Cruz',
    senderRole: 'student',
    receiverId: 'ict-1',
    receiverName: 'Mark Villanueva',
    message: 'The WiFi in Room 201 is working great now. Thanks for fixing it!',
    timestamp: new Date('2025-01-05T16:00:00'),
    ticketId: 'TKT-2025-007',
  },
  {
    id: 'msg-7',
    conversationId: createConversationId('student-1', 'ict-1'),
    senderId: 'ict-1',
    senderName: 'Mark Villanueva',
    senderRole: 'ict',
    receiverId: 'student-1',
    receiverName: 'Juan Dela Cruz',
    message: 'You\'re welcome! The access point needed replacement. Let me know if you have any other issues.',
    timestamp: new Date('2025-01-05T16:10:00'),
    ticketId: 'TKT-2025-007',
  },
  
  // Conversation between student-1 (Juan) and ict-2 (Lisa Ramos)
  {
    id: 'msg-8',
    conversationId: createConversationId('student-1', 'ict-2'),
    senderId: 'student-1',
    senderName: 'Juan Dela Cruz',
    senderRole: 'student',
    receiverId: 'ict-2',
    receiverName: 'Lisa Ramos',
    message: 'Hi Lisa, I need help with my email storage quota.',
    timestamp: new Date('2024-12-20T10:30:00'),
    ticketId: 'TKT-2025-010',
  },
  {
    id: 'msg-9',
    conversationId: createConversationId('student-1', 'ict-2'),
    senderId: 'ict-2',
    senderName: 'Lisa Ramos',
    senderRole: 'ict',
    receiverId: 'student-1',
    receiverName: 'Juan Dela Cruz',
    message: 'Hi Juan! I can help with that. Let me check your current usage and increase your quota.',
    timestamp: new Date('2024-12-20T10:45:00'),
    ticketId: 'TKT-2025-010',
  },
  {
    id: 'msg-10',
    conversationId: createConversationId('student-1', 'ict-2'),
    senderId: 'ict-2',
    senderName: 'Lisa Ramos',
    senderRole: 'ict',
    receiverId: 'student-1',
    receiverName: 'Juan Dela Cruz',
    message: 'All done! I\'ve increased your mailbox to 10GB and archived some old emails. You should be good now.',
    timestamp: new Date('2024-12-20T14:00:00'),
    ticketId: 'TKT-2025-010',
  },
  {
    id: 'msg-11',
    conversationId: createConversationId('student-1', 'ict-2'),
    senderId: 'student-1',
    senderName: 'Juan Dela Cruz',
    senderRole: 'student',
    receiverId: 'ict-2',
    receiverName: 'Lisa Ramos',
    message: 'Awesome, that worked! Thanks Lisa!',
    timestamp: new Date('2024-12-20T14:15:00'),
    ticketId: 'TKT-2025-010',
  },

  // Conversation between faculty-1 and ict-2
  {
    id: 'msg-12',
    conversationId: createConversationId('faculty-1', 'ict-2'),
    senderId: 'faculty-1',
    senderName: 'Prof. Ana Garcia',
    senderRole: 'faculty',
    receiverId: 'ict-2',
    receiverName: 'Lisa Ramos',
    message: 'The projector in Room 305 is still not working. I have a class in 20 minutes.',
    timestamp: new Date('2025-01-10T09:30:00'),
    ticketId: 'TKT-2025-002',
  },
  {
    id: 'msg-13',
    conversationId: createConversationId('faculty-1', 'ict-2'),
    senderId: 'ict-2',
    senderName: 'Lisa Ramos',
    senderRole: 'ict',
    receiverId: 'faculty-1',
    receiverName: 'Prof. Ana Garcia',
    message: 'I\'m on my way to Room 305 right now with replacement cables. I\'ll have it working before your class starts.',
    timestamp: new Date('2025-01-10T09:35:00'),
    ticketId: 'TKT-2025-002',
  },
  {
    id: 'msg-14',
    conversationId: createConversationId('faculty-1', 'ict-2'),
    senderId: 'faculty-1',
    senderName: 'Prof. Ana Garcia',
    senderRole: 'faculty',
    receiverId: 'ict-2',
    receiverName: 'Lisa Ramos',
    message: 'Thank you so much! I really appreciate your quick response.',
    timestamp: new Date('2025-01-10T09:40:00'),
    ticketId: 'TKT-2025-002',
  },
  // Conversation between student-2 and ict-1
  {
    id: 'msg-15',
    conversationId: createConversationId('student-2', 'ict-1'),
    senderId: 'student-2',
    senderName: 'Maria Santos',
    senderRole: 'student',
    receiverId: 'ict-1',
    receiverName: 'Mark Villanueva',
    message: 'Hello! The WiFi in the library is really slow today. Is there a problem?',
    timestamp: new Date('2025-01-09T14:30:00'),
    ticketId: 'TKT-2025-003',
  },
  {
    id: 'msg-16',
    conversationId: createConversationId('student-2', 'ict-1'),
    senderId: 'ict-1',
    senderName: 'Mark Villanueva',
    senderRole: 'ict',
    receiverId: 'student-2',
    receiverName: 'Maria Santos',
    message: 'Hi Maria! We\'re aware of this issue. I\'m checking the network configuration now.',
    timestamp: new Date('2025-01-09T14:45:00'),
    ticketId: 'TKT-2025-003',
  },
  {
    id: 'msg-17',
    conversationId: createConversationId('student-2', 'ict-1'),
    senderId: 'ict-1',
    senderName: 'Mark Villanueva',
    senderRole: 'ict',
    receiverId: 'student-2',
    receiverName: 'Maria Santos',
    message: 'Good news! I\'ve resolved the issue by optimizing the bandwidth allocation. The WiFi should be back to normal speed now.',
    timestamp: new Date('2025-01-09T16:45:00'),
    ticketId: 'TKT-2025-003',
  },
  {
    id: 'msg-18',
    conversationId: createConversationId('student-2', 'ict-1'),
    senderId: 'student-2',
    senderName: 'Maria Santos',
    senderRole: 'student',
    receiverId: 'ict-1',
    receiverName: 'Mark Villanueva',
    message: 'Yes, it\'s working great now! Thank you so much!',
    timestamp: new Date('2025-01-09T17:00:00'),
    ticketId: 'TKT-2025-003',
  },
];

// Helper functions for chat
export const getConversationMessages = (userId1: string, userId2: string): ChatMessage[] => {
  const conversationId = createConversationId(userId1, userId2);
  return dummyChatMessages
    .filter(msg => msg.conversationId === conversationId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

export const getLastMessageForConversation = (userId1: string, userId2: string): ChatMessage | undefined => {
  const messages = getConversationMessages(userId1, userId2);
  return messages.length > 0 ? messages[messages.length - 1] : undefined;
};

export const getUserConversations = (userId: string): { contact: User; lastMessage: ChatMessage | undefined }[] => {
  const user = dummyUsers.find(u => u.id === userId);
  if (!user) return [];

  // Get all ICT staff if user is student/faculty, or get students/faculty if user is ICT
  const potentialContacts = user.role === 'ict' 
    ? dummyUsers.filter(u => u.role === 'student' || u.role === 'faculty')
    : dummyUsers.filter(u => u.role === 'ict');

  return potentialContacts.map(contact => ({
    contact,
    lastMessage: getLastMessageForConversation(userId, contact.id),
  })).filter(conv => conv.lastMessage !== undefined); // Only show conversations with messages
};