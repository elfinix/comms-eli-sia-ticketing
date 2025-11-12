import { motion } from "framer-motion";

interface MainLoginPageProps {
  onSelectPortal: (portal: 'student' | 'faculty' | 'ict' | 'admin') => void;
}

const portals = [
  {
    id: 'student' as const,
    title: 'STUDENT PORTAL',
    description: 'Submit and track your support tickets',
    icon: 'https://img.icons8.com/color/96/000000/graduation-cap--v1.png',
    gradient: 'from-[#8B0000] to-[#6B0000]',
  },
  {
    id: 'faculty' as const,
    title: 'FACULTY PORTAL',
    description: 'Report academic technology issues',
    icon: 'https://img.icons8.com/color/96/000000/manager.png',
    gradient: 'from-[#6B0000] to-[#8B0000]',
  },
  {
    id: 'ict' as const,
    title: 'ICT STAFF PORTAL',
    description: 'Resolve tickets and assist users',
    icon: 'https://img.icons8.com/color/96/000000/support.png',
    gradient: 'from-[#8B0000] to-[#6B0000]',
  },
  {
    id: 'admin' as const,
    title: 'ADMINISTRATOR PORTAL',
    description: 'Manage users and oversee operations',
    icon: 'https://img.icons8.com/color/96/000000/settings--v1.png',
    gradient: 'from-[#6B0000] to-[#8B0000]',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  hover: {
    y: -8,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

export default function MainLoginPage({ onSelectPortal }: MainLoginPageProps) {
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
        className="w-full max-w-[1280px] mx-auto px-8 py-16 relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div className="text-center mb-20" variants={itemVariants}>
          <motion.p 
            className="font-['Josefin_Sans',sans-serif] text-[32px] text-white mb-2 tracking-wide"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            LYCEUM OF THE PHILIPPINES UNIVERSITY - CAVITE
          </motion.p>
          <motion.div 
            className="h-1 w-32 bg-white/30 mx-auto mb-4 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.p 
            className="font-['Josefin_Sans',sans-serif] text-[34px] text-white mb-8 tracking-wide"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            IT HELPDESK SYSTEM
          </motion.p>
          <motion.p 
            className="font-['Jost',sans-serif] text-[18px] text-white/90 tracking-wide"
            variants={itemVariants}
          >
            Choose your login portal to get started
          </motion.p>
        </motion.div>

        {/* Login Portal Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20 max-w-[900px] mx-auto"
          variants={containerVariants}
        >
          {portals.map(portal => (
            <motion.div 
              key={portal.id}
              variants={cardVariants}
              whileHover="hover"
              className="group"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 flex flex-col items-center shadow-2xl hover:shadow-[0_20px_60px_rgba(139,0,0,0.3)] transition-all duration-300 border border-white/20 relative overflow-hidden h-[400px]">
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(139,0,0,0.03)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 w-full flex flex-col items-center justify-between h-full">
                  <div className="flex flex-col items-center flex-1 justify-center">
                    <motion.div 
                      className="w-[90px] h-[90px] mb-6 relative"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="absolute inset-0 bg-[rgba(139,0,0,0.1)] rounded-full blur-xl group-hover:bg-[rgba(139,0,0,0.2)] transition-all duration-300" />
                      <img 
                        alt={portal.title} 
                        className="w-full h-full object-cover relative z-10" 
                        color="rgba(139,0,0,0.85)" 
                        size={90} 
                        src={portal.icon}
                      />
                    </motion.div>
                    <p className="font-['Josefin_Sans',sans-serif] text-[26px] text-[rgba(139,0,0,0.85)] tracking-wide">
                      {portal.title}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => onSelectPortal(portal.id)}
                    className="relative bg-[rgba(139,0,0,0.85)] text-white rounded-xl px-12 py-2.5 font-['Abel',sans-serif] text-[16px] overflow-hidden group/btn w-[190px] shadow-lg flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10">Login</span>
                    <motion.div 
                      className="absolute inset-0 bg-[rgba(139,0,0,1)]"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center text-white/90"
          variants={itemVariants}
        >
          <p className="font-['Abel',sans-serif] text-[15px] mb-2 tracking-wide">
            © 2025 Lyceum Cavite ICT Department
          </p>
          <p className="font-['Abel',sans-serif] text-[14px] text-white/70">
            Need help? Contact <span className="text-white underline">support@lyceum-cavite.edu.ph</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}