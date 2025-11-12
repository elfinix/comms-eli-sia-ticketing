import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  iconBgColor,
  trend 
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-['Abel',sans-serif] mb-2">{title}</p>
          <p className="font-['Josefin_Sans',sans-serif] text-3xl text-gray-900 mb-1">{value}</p>
          {trend && (
            <p className={`text-sm font-['Abel',sans-serif] ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );
}
