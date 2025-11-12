import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { ArrowLeft, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from "motion/react";

interface LoginFormProps {
  portal: 'student' | 'faculty' | 'ict' | 'admin';
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
}

const portalConfig = {
  student: {
    title: 'STUDENT LOGIN',
    icon: 'https://img.icons8.com/color/96/000000/graduation-cap--v1.png',
    iconSize: 'w-[90px] h-[90px]',
  },
  faculty: {
    title: 'FACULTY LOGIN',
    icon: 'https://img.icons8.com/color/96/000000/manager.png',
    iconSize: 'w-[85px] h-[85px]',
  },
  ict: {
    title: 'ICT STAFF LOGIN',
    icon: 'https://img.icons8.com/color/96/000000/support.png',
    iconSize: 'w-[115px] h-[115px]',
  },
  admin: {
    title: 'ADMINISTRATOR LOGIN',
    icon: 'https://img.icons8.com/color/96/000000/settings--v1.png',
    iconSize: 'w-[129px] h-[129px]',
  },
};

export default function LoginForm({ portal, onBack, onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const config = portalConfig[portal];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin(email, password);
    }, 800);
  };

  return (
    <div className="bg-gradient-to-br from-[#8B0000] via-[#6B0000] to-[#4B0000] relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <motion.div 
        className="w-full max-w-[520px] mx-auto px-8 py-16 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Button */}
        <motion.button
          onClick={onBack}
          className="flex items-center gap-2 text-white mb-8 hover:text-white/80 transition-colors group"
          whileHover={{ x: -5 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-['Abel',sans-serif]">Back to portal selection</span>
        </motion.button>

        {/* Login Card */}
        <motion.div 
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-2xl border border-white/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Icon and Title */}
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              className={`${config.iconSize} mb-5 relative`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            >
              <div className="absolute inset-0 bg-[rgba(139,0,0,0.1)] rounded-full blur-2xl" />
              <img 
                alt={config.title} 
                className="w-full h-full object-cover relative z-10" 
                src={config.icon!} 
              />
            </motion.div>
            <motion.h1 
              className="font-['Josefin_Sans',sans-serif] text-[30px] text-[rgba(139,0,0,0.9)] text-center tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {config.title}
            </motion.h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Label htmlFor="email" className="text-[rgba(139,0,0,0.8)]">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(139,0,0,0.4)] pointer-events-none" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 border-[rgba(139,0,0,0.2)] focus:border-[rgba(139,0,0,0.6)] focus:ring-[rgba(139,0,0,0.2)] transition-all duration-200 h-11"
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Label htmlFor="password" className="text-[rgba(139,0,0,0.8)]">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(139,0,0,0.4)] pointer-events-none" size={18} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 border-[rgba(139,0,0,0.2)] focus:border-[rgba(139,0,0,0.6)] focus:ring-[rgba(139,0,0,0.2)] transition-all duration-200 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(139,0,0,0.4)] hover:text-[rgba(139,0,0,0.7)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {error && (
              <motion.div 
                className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AlertCircle size={18} className="flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[rgba(139,0,0,0.9)] hover:bg-[rgba(139,0,0,1)] text-white rounded-xl py-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10 font-['Abel',sans-serif] text-[17px]">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </Button>
            </motion.div>

            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <p className="text-sm text-[rgba(139,0,0,0.7)]">
                Need help accessing your account?
              </p>
              <p className="text-sm text-[rgba(139,0,0,0.7)]">
                Contact ICT Support: <a href="mailto:support@lyceum-cavite.edu.ph" className="hover:text-[rgba(139,0,0,1)] hover:underline transition-colors">support@lyceum-cavite.edu.ph</a>
              </p>
            </motion.div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center text-white/90 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="font-['Abel',sans-serif] text-[14px] mb-2 tracking-wide">
            © 2025 Lyceum Cavite ICT Department
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}