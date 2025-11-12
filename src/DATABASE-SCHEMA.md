# LPU-Cavite IT Helpdesk System - Database Schema

## Overview
This document outlines the complete database schema for the Lyceum of the Philippines University – Cavite IT Helpdesk Ticketing System.

---

## 📊 **Table 1: users**
Stores all user accounts (Students, Faculty, ICT Staff, Admins)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| `email` | TEXT | UNIQUE, NOT NULL | User email (login credential) |
| `password_hash` | TEXT | NOT NULL | Hashed password |
| `name` | TEXT | NOT NULL | Full name of user |
| `role` | TEXT | NOT NULL, CHECK | User role: 'student', 'faculty', 'ict', 'admin' |
| `department` | TEXT | NULLABLE | User's department/program |
| `avatar_url` | TEXT | NULLABLE | Profile picture URL |
| `status` | TEXT | DEFAULT 'active', CHECK | Account status: 'active', 'inactive' |
| `joined_date` | DATE | DEFAULT CURRENT_DATE | Account creation date |
| `last_login` | TIMESTAMPTZ | NULLABLE | Last login timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_role` on `role`
- `idx_users_status` on `status`

---

## 🎫 **Table 2: tickets**
Stores all support tickets submitted by students/faculty

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Format: TKT-YYMM-NNN (e.g., TKT-2511-001) |
| `title` | TEXT | NOT NULL | Ticket subject/title |
| `description` | TEXT | NOT NULL | Detailed description of the issue |
| `category` | TEXT | NOT NULL, CHECK | 'Hardware', 'Software', 'Network', 'Account' |
| `urgency` | TEXT | NOT NULL, CHECK | 'Low', 'Medium', 'High' |
| `status` | TEXT | DEFAULT 'Open', CHECK | 'Open', 'In Progress', 'Resolved', 'Closed' |
| `submitted_by` | UUID | NOT NULL, FOREIGN KEY → users(id) | User who created the ticket |
| `assigned_to` | UUID | NULLABLE, FOREIGN KEY → users(id) | ICT staff assigned to ticket |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ticket creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `resolved_at` | TIMESTAMPTZ | NULLABLE | Resolution timestamp |
| `closed_at` | TIMESTAMPTZ | NULLABLE | Closure timestamp |

**Indexes:**
- `idx_tickets_submitted_by` on `submitted_by`
- `idx_tickets_assigned_to` on `assigned_to`
- `idx_tickets_status` on `status`
- `idx_tickets_category` on `category`
- `idx_tickets_urgency` on `urgency`

**Auto-generated ID:** Ticket IDs are automatically generated using format `TKT-YYMM-NNN`

---

## 📝 **Table 3: ticket_notes**
Internal notes added to tickets by ICT staff

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique note identifier |
| `ticket_id` | TEXT | NOT NULL, FOREIGN KEY → tickets(id) ON DELETE CASCADE | Associated ticket |
| `author_id` | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | User who wrote the note |
| `note` | TEXT | NOT NULL | Note content |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Note creation timestamp |

**Indexes:**
- `idx_ticket_notes_ticket_id` on `ticket_id`
- `idx_ticket_notes_created_at` on `created_at DESC`

---

## 📎 **Table 4: ticket_attachments**
File attachments for tickets (screenshots, logs, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique attachment identifier |
| `ticket_id` | TEXT | NOT NULL, FOREIGN KEY → tickets(id) ON DELETE CASCADE | Associated ticket |
| `uploaded_by` | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | User who uploaded the file |
| `file_name` | TEXT | NOT NULL | Original file name |
| `file_url` | TEXT | NOT NULL | Storage URL of the file |
| `file_size` | INTEGER | NOT NULL, CHECK (≤ 10485760) | File size in bytes (max 10MB) |
| `mime_type` | TEXT | NOT NULL | File MIME type |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

**Indexes:**
- `idx_ticket_attachments_ticket_id` on `ticket_id`

**File Size Limit:** 10MB per file

---

## 💬 **Table 5: chat_messages**
Real-time chat between users and ICT staff

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique message identifier |
| `conversation_id` | TEXT | NOT NULL | Unique conversation thread ID |
| `sender_id` | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Message sender |
| `receiver_id` | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Message receiver |
| `message` | TEXT | NOT NULL | Message content |
| `ticket_id` | TEXT | NULLABLE, FOREIGN KEY → tickets(id) ON DELETE SET NULL | Related ticket (optional) |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Message timestamp |

**Indexes:**
- `idx_chat_messages_conversation_id` on `conversation_id`
- `idx_chat_messages_sender_id` on `sender_id`
- `idx_chat_messages_receiver_id` on `receiver_id`
- `idx_chat_messages_created_at` on `created_at DESC`

---

## 🔔 **Table 6: notifications**
User notifications for ticket updates, assignments, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique notification identifier |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Recipient user |
| `title` | TEXT | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Notification message |
| `type` | TEXT | NOT NULL, CHECK | 'info', 'warning', 'success', 'error' |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read status |
| `ticket_id` | TEXT | NULLABLE, FOREIGN KEY → tickets(id) ON DELETE SET NULL | Related ticket (optional) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Notification timestamp |

**Indexes:**
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_is_read` on `is_read`
- `idx_notifications_created_at` on `created_at DESC`

---

## 📜 **Table 7: activity_logs**
Audit trail of user actions for security and tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique log identifier |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | User who performed action |
| `action` | TEXT | NOT NULL | Description of action performed |
| `ip_address` | TEXT | NULLABLE | IP address of user |
| `device` | TEXT | NULLABLE | Device/browser information |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_activity_logs_user_id` on `user_id`
- `idx_activity_logs_created_at` on `created_at DESC`

---

## ⚙️ **Table 8: system_settings**
System-wide configuration settings (editable by Admins)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Setting key (e.g., 'max_ticket_size') |
| `value` | TEXT | NOT NULL | Setting value |
| `description` | TEXT | NULLABLE | Description of what this setting controls |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `updated_by` | UUID | NULLABLE, FOREIGN KEY → users(id) ON DELETE SET NULL | Admin who last updated |

---

## 🔐 **Row Level Security (RLS) Policies**

### Recommended RLS Strategy:
1. **users table:** Users can read their own data; admins can read all
2. **tickets table:** Users can see their own tickets; ICT/Admin can see all
3. **ticket_notes:** Only visible to ticket creator and ICT/Admin
4. **ticket_attachments:** Same access as parent ticket
5. **chat_messages:** Only sender and receiver can access
6. **notifications:** Users can only see their own notifications
7. **activity_logs:** Users can see their own logs; Admin can see all
8. **system_settings:** Read-only for all; write access for Admin only

---

## 📌 **Key Business Rules**

1. **Ticket ID Format:** `TKT-YYMM-NNN` (auto-generated via trigger)
2. **File Upload Limit:** 10MB per file
3. **User Roles:** student, faculty, ict, admin
4. **Ticket Statuses:** Open → In Progress → Resolved → Closed
5. **Ticket Categories:** Hardware, Software, Network, Account
6. **Urgency Levels:** Low, Medium, High
7. **Data Retention:** Activity logs kept for audit purposes

---

## 🔄 **Real-time Subscriptions Needed**

- ✅ New tickets (for ICT Dashboard)
- ✅ Ticket status updates (for ticket creators)
- ✅ New chat messages (for active conversations)
- ✅ New notifications (for notification bell)
- ✅ Ticket assignments (for ICT Staff)

---

## ✅ **Review Checklist**

Before we proceed, please confirm:
- [ ] Are all required fields present?
- [ ] Are there any additional columns needed?
- [ ] Should we add any computed columns or views?
- [ ] Are the foreign key relationships correct?
- [ ] Do we need any additional indexes?
- [ ] Are there any missing tables?

---

**Status:** 🟡 **PENDING REVIEW** - Please review and approve before creating the database.
