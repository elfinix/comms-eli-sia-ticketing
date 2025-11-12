import { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  MessageSquare, 
  History, 
  Settings, 
  Users, 
  FileText, 
  Server,
  Bell,
  LogOut,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import NotificationBellDropdown from './NotificationBellDropdown';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: 'student' | 'faculty' | 'ict' | 'admin';
  userName: string;
  userEmail: string;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onNotificationTicketClick?: (ticketId: string) => void;
  onNotificationChatClick?: () => void;
}

const sidebarConfig = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Server },
  ],
  ict: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  faculty: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
};

const roleLabels = {
  admin: 'Administrator',
  ict: 'ICT Staff',
  faculty: 'Faculty',
  student: 'Student',
};

export default function DashboardLayout({
  children,
  userRole,
  userName,
  userEmail,
  currentPage,
  onNavigate,
  onLogout,
  onNotificationTicketClick,
  onNotificationChatClick,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuItems = sidebarConfig[userRole];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 fixed h-screen">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-lg flex items-center justify-center">
              <Ticket className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-['Josefin_Sans',sans-serif] text-[#8B0000]">IT Helpdesk</h1>
              <p className="text-xs text-gray-500 font-['Abel',sans-serif]">{roleLabels[userRole]}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-['Abel',sans-serif] ${
                      isActive
                        ? 'bg-[#8B0000] text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => onNavigate('profile')}
            className="w-full flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-full flex items-center justify-center text-white">
              {getInitials(userName)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-['Abel',sans-serif] text-sm truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </button>
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            size="sm"
          >
            <LogOut size={16} />
            <span className="font-['Abel',sans-serif]">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen w-64 bg-white z-50 lg:hidden flex flex-col shadow-xl"
            >
              {/* Mobile Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-lg flex items-center justify-center">
                    <Ticket className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="font-['Josefin_Sans',sans-serif] text-[#8B0000]">IT Helpdesk</h1>
                    <p className="text-xs text-gray-500 font-['Abel',sans-serif]">{roleLabels[userRole]}</p>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500">
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            onNavigate(item.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-['Abel',sans-serif] ${
                            isActive
                              ? 'bg-[#8B0000] text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon size={20} />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Mobile User Info */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#8B0000] to-[#6B0000] rounded-full flex items-center justify-center text-white">
                    {getInitials(userName)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-['Abel',sans-serif] text-sm truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                </button>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  size="sm"
                >
                  <LogOut size={16} />
                  <span className="font-['Abel',sans-serif]">Logout</span>
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu size={24} />
              </button>
              <h2 className="font-['Josefin_Sans',sans-serif] text-[#8B0000] text-xl capitalize">
                {currentPage}
              </h2>
            </div>

            {/* Desktop User Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <NotificationBellDropdown onViewAll={() => onNavigate('notifications')} userRole={userRole} onTicketClick={onNotificationTicketClick} onNavigateToChat={onNotificationChatClick} />
            </div>

            {/* Mobile Notification Bell */}
            <div className="lg:hidden">
              <NotificationBellDropdown onViewAll={() => onNavigate('notifications')} userRole={userRole} onTicketClick={onNotificationTicketClick} onNavigateToChat={onNotificationChatClick} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}