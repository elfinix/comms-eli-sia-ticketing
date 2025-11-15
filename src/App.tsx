import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainLoginPage from './pages/MainLoginPage';
import LoginForm from './pages/LoginForm';
import AdminDashboard from './pages/AdminDashboard';
import ICTDashboard from './pages/ICTDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import MaintenanceModePage from './components/MaintenanceModePage';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole } from './lib/types';
import { supabase } from './lib/supabaseClient';

type Portal = 'student' | 'faculty' | 'ict' | 'admin';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-['Abel',sans-serif]">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    toast.error('Access Denied', {
      description: `You don't have permission to access this page.`,
    });
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}

// Portal selection page
function PortalSelectionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to their dashboard
  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, navigate]);

  const handleSelectPortal = (portal: Portal) => {
    navigate(`/login/${portal}`);
  };

  return (
    <>
      <MainLoginPage onSelectPortal={handleSelectPortal} />
      <Toaster />
    </>
  );
}

// Login page with portal parameter
function LoginPage() {
  const { portal } = useParams<{ portal: Portal }>();
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to their dashboard
  // But ONLY if they're on the correct portal
  useEffect(() => {
    if (user && user.role === portal) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, portal, navigate]);

  const handleBack = () => {
    navigate('/', { replace: true });
  };

  const handleLogin = async (email: string, password: string) => {
    if (!portal) return;

    const result = await signIn(email, password);
    
    if (result.success) {
      // Check if the logged-in user's role matches the selected portal
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single();
        
        if (profile && profile.role !== portal) {
          // Role mismatch - sign out and show error
          toast.error('Access Denied', {
            description: `You are a ${profile.role} user. Please use the ${profile.role} portal instead. Logging out...`,
          });
          
          // Sign out after a brief delay to show the message
          setTimeout(async () => {
            await signOut();
            navigate('/', { replace: true });
          }, 2000);
          return;
        }
      }
      
      toast.success('Login Successful', {
        description: `Welcome back!`,
      });
      // Navigation will happen automatically via useEffect when user state updates
    } else {
      toast.error('Login Failed', {
        description: result.error || 'Invalid credentials. Please check your email and password.',
      });
    }
  };

  if (!portal || !['student', 'faculty', 'ict', 'admin'].includes(portal)) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <LoginForm 
        portal={portal} 
        onBack={handleBack} 
        onLogin={handleLogin}
      />
      <Toaster />
    </>
  );
}

// Dashboard wrapper components
function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
    toast.info('Logged out successfully');
  };

  if (!user) return <LoadingScreen />;

  return (
    <NotificationsProvider userId={user.id}>
      <AdminDashboard onLogout={handleLogout} currentUserId={user.id} />
      <Toaster />
    </NotificationsProvider>
  );
}

function ICTDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_message']);

      if (!error && data) {
        const modeEntry = data.find(item => item.key === 'maintenance_mode');
        const messageEntry = data.find(item => item.key === 'maintenance_message');
        
        setMaintenanceMode(modeEntry?.value === 'true');
        setMaintenanceMessage(messageEntry?.value || 'System is under maintenance. We will be back soon.');
      }
      setLoading(false);
    };

    checkMaintenanceMode();

    // Subscribe to maintenance mode changes
    const channel = supabase
      .channel('maintenance-mode-ict')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=in.(maintenance_mode,maintenance_message)',
        },
        () => {
          // Refetch settings on update
          checkMaintenanceMode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
    toast.info('Logged out successfully');
  };

  if (!user) return <LoadingScreen />;
  if (loading) return <LoadingScreen />;
  if (maintenanceMode) return <MaintenanceModePage message={maintenanceMessage} />;

  return (
    <NotificationsProvider userId={user.id}>
      <ICTDashboard onLogout={handleLogout} currentUserId={user.id} />
      <Toaster />
    </NotificationsProvider>
  );
}

function FacultyDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_message']);

      if (!error && data) {
        const modeEntry = data.find(item => item.key === 'maintenance_mode');
        const messageEntry = data.find(item => item.key === 'maintenance_message');
        
        setMaintenanceMode(modeEntry?.value === 'true');
        setMaintenanceMessage(messageEntry?.value || 'System is under maintenance. We will be back soon.');
      }
      setLoading(false);
    };

    checkMaintenanceMode();

    // Subscribe to maintenance mode changes
    const channel = supabase
      .channel('maintenance-mode-faculty')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=in.(maintenance_mode,maintenance_message)',
        },
        () => {
          // Refetch settings on update
          checkMaintenanceMode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
    toast.info('Logged out successfully');
  };

  if (!user) return <LoadingScreen />;
  if (loading) return <LoadingScreen />;
  if (maintenanceMode) return <MaintenanceModePage message={maintenanceMessage} />;

  return (
    <NotificationsProvider userId={user.id}>
      <FacultyDashboard onLogout={handleLogout} currentUserId={user.id} />
      <Toaster />
    </NotificationsProvider>
  );
}

function StudentDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_message']);

      if (!error && data) {
        const modeEntry = data.find(item => item.key === 'maintenance_mode');
        const messageEntry = data.find(item => item.key === 'maintenance_message');
        
        setMaintenanceMode(modeEntry?.value === 'true');
        setMaintenanceMessage(messageEntry?.value || 'System is under maintenance. We will be back soon.');
      }
      setLoading(false);
    };

    checkMaintenanceMode();

    // Subscribe to maintenance mode changes
    const channel = supabase
      .channel('maintenance-mode-student')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=in.(maintenance_mode,maintenance_message)',
        },
        () => {
          // Refetch settings on update
          checkMaintenanceMode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
    toast.info('Logged out successfully');
  };

  if (!user) return <LoadingScreen />;
  if (loading) return <LoadingScreen />;
  if (maintenanceMode) return <MaintenanceModePage message={maintenanceMessage} />;

  return (
    <NotificationsProvider userId={user.id}>
      <StudentDashboard onLogout={handleLogout} currentUserId={user.id} />
      <Toaster />
    </NotificationsProvider>
  );
}

// Main app content with routes
function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Portal selection page */}
      <Route path="/" element={<PortalSelectionPage />} />
      
      {/* Login pages */}
      <Route path="/login/:portal" element={<LoginPage />} />
      
      {/* Protected dashboard routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ict" 
        element={
          <ProtectedRoute allowedRoles={['ict']}>
            <ICTDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/faculty" 
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}