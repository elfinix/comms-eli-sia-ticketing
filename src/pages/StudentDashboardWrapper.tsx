import { useAuth } from '../contexts/AuthContext';
import { useTickets } from '../lib/hooks/useTickets';
import { useNotifications } from '../lib/hooks/useNotifications';
import StudentDashboard from './StudentDashboard';

interface StudentDashboardWrapperProps {
  onLogout: () => void;
}

export default function StudentDashboardWrapper({ onLogout }: StudentDashboardWrapperProps) {
  const { user } = useAuth();
  const { tickets, loading: ticketsLoading } = useTickets(user?.id);
  const { notifications, loading: notificationsLoading } = useNotifications(user?.id || '');

  if (!user) {
    return <div>Not authenticated</div>;
  }

  if (ticketsLoading || notificationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <StudentDashboard 
      onLogout={onLogout}
      user={user}
      tickets={tickets}
      notifications={notifications}
    />
  );
}
