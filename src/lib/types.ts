// ============================================
// LPU-Cavite IT Helpdesk System - TypeScript Types
// ============================================

export type UserRole = 'student' | 'faculty' | 'ict' | 'admin';
export type UserStatus = 'active' | 'inactive';
export type TicketCategory = 'Hardware' | 'Software' | 'Network' | 'Account';
export type TicketUrgency = 'Low' | 'Medium' | 'High';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

// ============================================
// Database Table Types
// ============================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  department: string | null;
  avatar_url: string | null;
  status: UserStatus;
  joined_date: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  urgency: TicketUrgency;
  status: TicketStatus;
  submitted_by: string;
  assigned_to: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  resolution_notes: string | null;
  resolution_attachment: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export interface TicketNote {
  id: string;
  ticket_id: string;
  author_id: string;
  note: string;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  ticket_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  ticket_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string | null;
  device: string | null;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

// ============================================
// Extended Types with Relations
// ============================================

export interface TicketWithRelations extends Ticket {
  submitted_by_user?: User;
  assigned_to_user?: User;
  notes?: TicketNote[];
  attachments?: TicketAttachment[];
}

export interface NotificationWithTicket extends Notification {
  ticket?: Ticket;
}

export interface ChatMessageWithUsers extends ChatMessage {
  sender?: User;
  receiver?: User;
}

export interface ActivityLogWithUser extends ActivityLog {
  user?: User;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ============================================
// Dashboard Statistics Types
// ============================================

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byCategory: {
    hardware: number;
    software: number;
    network: number;
    account: number;
  };
  byUrgency: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: {
    students: number;
    faculty: number;
    ict: number;
    admins: number;
  };
}

export interface SystemStats {
  averageResponseTime: number; // in hours
  averageResolutionTime: number; // in hours
  satisfactionRate: number; // percentage
  ticketsThisMonth: number;
  ticketsThisWeek: number;
  ticketsToday: number;
}