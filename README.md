# 🎓 LPU-Cavite IT Helpdesk Ticketing System

A modern, full-featured IT helpdesk ticketing system built for **Lyceum of the Philippines University - Cavite**. This web application streamlines the process of reporting, tracking, and resolving technical issues across the university campus.

![LPU-Cavite Brand Colors](https://img.shields.io/badge/Brand-Crimson%20Red%20%23800000-800000?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## 📋 Table of Contents

-   [Features](#-features)
-   [Tech Stack](#-tech-stack)
-   [User Roles](#-user-roles)
-   [Getting Started](#-getting-started)
-   [Project Structure](#-project-structure)
-   [Workflow](#-workflow)
-   [Environment Variables](#-environment-variables)
-   [Default Credentials](#-default-credentials)
-   [Contributing](#-contributing)
-   [License](#-license)

---

## ✨ Features

### 🎫 **Ticket Management**

-   Create, track, and manage support tickets
-   Real-time ticket status updates
-   Priority levels (Low, Medium, High, Urgent)
-   Category-based ticket routing (Hardware, Software, Internet, Accounts)
-   File attachment support for screenshots and documents
-   Comprehensive ticket history and activity logs

### 💬 **Real-Time Chat**

-   Live chat between students/faculty and ICT staff
-   Chat initiation controlled by ICT staff
-   Typing indicators and message timestamps
-   Chat history preservation

### 👥 **User Management**

-   Role-based access control (Student, Faculty, ICT Staff, Admin)
-   Department-based ticket assignment
-   User status management (Active/Inactive)
-   Auto-generated secure passwords

### 📊 **Analytics & Reporting**

-   Dashboard with ticket statistics
-   Performance metrics for ICT staff
-   Visual charts for ticket trends
-   Department-wise ticket distribution

### 🔔 **Notification System**

-   Real-time notifications for ticket updates
-   Role-specific notification filtering
-   Notification preferences management
-   Toast notifications for instant feedback

### 🎨 **Modern UI/UX**

-   Clean, responsive design following LPU-Cavite branding
-   Crimson red (#800000) color scheme
-   Smooth animations and transitions
-   Mobile-responsive layouts
-   Accessible components (Shadcn UI)

---

## 🛠️ Tech Stack

### **Frontend**

-   **React 18** - UI library
-   **TypeScript** - Type safety and better developer experience
-   **Tailwind CSS 4.0** - Utility-first styling
-   **Shadcn UI** - Accessible component library
-   **Motion (Framer Motion)** - Smooth animations
-   **Recharts** - Data visualization
-   **Sonner** - Toast notifications
-   **Lucide React** - Icon library

### **Backend**

-   **Supabase** - Backend-as-a-Service
    -   PostgreSQL database
    -   Authentication & authorization
    -   Real-time subscriptions
    -   Edge Functions (Hono server)
    -   Storage for file attachments

### **Development Tools**

-   **Vite** - Build tool
-   **ESLint** - Code linting
-   **PostCSS** - CSS processing

---

## 👥 User Roles

### 🎓 **Student**

-   Submit support tickets for technical issues
-   Track ticket status and updates
-   Chat with assigned ICT staff
-   Upload attachments (screenshots, documents)
-   View personal ticket history

### 👨‍🏫 **Faculty**

-   Report academic technology issues
-   Priority ticket handling
-   Real-time chat with ICT support
-   Track resolution progress
-   Access to all student features

### 💻 **ICT Staff**

-   View assigned tickets based on department
-   Update ticket status and priority
-   Initiate and manage chat conversations
-   Add internal notes to tickets
-   Upload resolution files
-   Department specialization:
    -   **ICT - Hardware**: Physical equipment issues
    -   **ICT - Software**: Application and software problems
    -   **ICT - Internet**: Network and connectivity issues
    -   **ICT - Accounts**: User account and access management

### 👑 **Administrator**

-   Complete system oversight
-   User management (create, edit, delete users)
-   Ticket assignment and reassignment
-   System configuration and settings
-   Notification management
-   Analytics and reporting
-   Manage all departments

---

## 🚀 Getting Started

### **Prerequisites**

-   Node.js 18+ installed
-   npm or yarn package manager
-   Supabase account (free tier works)

### **Installation**

1. **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/lpu-cavite-helpdesk.git
    cd lpu-cavite-helpdesk
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Set up Supabase**

    - Create a new project at [supabase.com](https://supabase.com)
    - Run the database migrations (see [Database Setup](#database-setup))
    - Deploy the edge functions

4. **Configure environment variables**

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your Supabase credentials:

    ```env
    VITE_SUPABASE_URL=your-project-url
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```

5. **Start the development server**

    ```bash
    npm run dev
    ```

6. **Open your browser**
    ```
    http://localhost:5173
    ```

---

## 📁 Project Structure

```
lpu-cavite-helpdesk/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── ict/            # ICT staff components
│   │   ├── student/        # Student/Faculty components
│   │   ├── ui/             # Shadcn UI components
│   │   └── figma/          # Figma-imported components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── lib/                # Utilities and types
│   ├── styles/             # Global styles
│   ├── utils/              # Helper functions
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── supabase/
│   └── functions/
│       └── server/         # Edge functions (Hono server)
│           ├── index.tsx   # Main server file
│           └── kv_store.tsx # Key-value store utilities
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

## 🔄 Workflow

### **Ticket Lifecycle**

```
1. Student/Faculty submits ticket
   ↓
2. Admin assigns ticket to department
   ↓
3. All ICT staff in that department receive the ticket
   ↓
4. ICT staff member claims and works on ticket
   ↓
5. ICT staff can initiate chat with user
   ↓
6. Ticket status updated: In Progress → Resolved
   ↓
7. User receives notification of resolution
```

### **Chat Flow**

```
1. ICT staff initiates chat from ticket view
   ↓
2. "Chat with ICT Staff" button appears for Student/Faculty
   ↓
3. Real-time messaging enabled
   ↓
4. Chat history preserved with ticket
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend Configuration (for Edge Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=your-database-url
```

---

## 🔑 Default Credentials

After initial setup, you can create users through the Admin panel. The default password format is:

**Format:** `emailPrefix_role`

However, for initial sample:

-   Student: `juan.delacruz@lpu.edu.ph` → Password: `student`
-   Faculty: `prof.garcia@lpu.edu.ph` → Password: `faculty`
-   ICT Staff: `ict.staff1@lpu.edu.ph` → Password: `ict`
-   Admin: `admin@lpu.edu.ph` → Password: `admin`

---

## 📊 Database Setup

The system uses Supabase PostgreSQL database with the following main tables:

-   **users** - User accounts and profiles
-   **tickets** - Support tickets
-   **messages** - Chat messages
-   **notifications** - User notifications
-   **kv_store_0488e420** - Key-value storage

The database schema is automatically managed through Supabase migrations.

---

## 🎨 Design System

### **Color Palette**

-   **Primary:** Crimson Red `#800000` (LPU-Cavite brand color)
-   **Secondary:** Dark Crimson `#6B0000`
-   **Neutrals:** Grays, whites, and light backgrounds
-   **Status Colors:**
    -   Success: Green `#10B981`
    -   Warning: Yellow `#F59E0B`
    -   Error: Red `#EF4444`
    -   Info: Blue `#3B82F6`

### **Typography**

-   **Headings:** Josefin Sans
-   **Body:** Abel
-   Clean, modern, and highly readable

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Code Style**

-   Follow TypeScript best practices
-   Use functional components with hooks
-   Maintain consistent formatting (Prettier)
-   Write meaningful commit messages

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues, questions, or suggestions:

-   **Create an issue** in this repository
-   **Email:** support@lyceum-cavite.edu.ph
-   **Website:** [www.lyceum-cavite.edu.ph](https://www.lyceum-cavite.edu.ph)

---

## 🙏 Acknowledgments

-   **Lyceum of the Philippines University - Cavite** for project sponsorship
-   **Supabase** for the amazing backend platform
-   **Shadcn UI** for the beautiful component library
-   **Vercel** for inspiration on modern web design

---

<div align="center">

**Built with ❤️ for Lyceum of the Philippines University - Cavite**

![LPU-Cavite](https://img.shields.io/badge/LPU-Cavite-800000?style=for-the-badge)

</div>
