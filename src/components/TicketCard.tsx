import { Ticket } from '../lib/types';
import { Calendar, User, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface TicketCardProps {
  ticket: Ticket & { 
    assignedToName?: string;
    submittedByName?: string;
  };
  onClick: () => void;
  showAssignee?: boolean;
}

const urgencyColors = {
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  High: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors = {
  Open: 'bg-orange-100 text-orange-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  Open: Clock,
  'In Progress': AlertCircle,
  Resolved: CheckCircle,
  Closed: CheckCircle,
};

const categoryColors = {
  Hardware: 'bg-purple-50 text-purple-700 border-purple-200',
  Software: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Network: 'bg-orange-50 text-orange-700 border-orange-200',
  Account: 'bg-green-50 text-green-700 border-green-200',
};

export default function TicketCard({ ticket, onClick, showAssignee = false }: TicketCardProps) {
  const StatusIcon = statusIcons[ticket.status];

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm cursor-pointer hover:border-[#8B0000]/30"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-['Abel',sans-serif] text-sm text-gray-500">{ticket.id}</span>
            <span className={`px-2 py-1 rounded-md text-xs font-['Abel',sans-serif] border ${urgencyColors[ticket.urgency]}`}>
              {ticket.urgency}
            </span>
          </div>
          <h3 className="font-['Josefin_Sans',sans-serif] text-gray-900 mb-2 line-clamp-1">
            {ticket.title}
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['Abel',sans-serif] ${statusColors[ticket.status]}`}>
          <StatusIcon size={14} />
          <span>{ticket.status}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm font-['Abel',sans-serif] mb-4 line-clamp-2">
        {ticket.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Calendar size={14} />
            <span className="font-['Abel',sans-serif]">
              {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>
          <span className={`px-2 py-1 rounded-md font-['Abel',sans-serif] border ${categoryColors[ticket.category]}`}>
            {ticket.category}
          </span>
        </div>
        {showAssignee && ticket.assignedToName && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <User size={14} />
            <span className="font-['Abel',sans-serif]">{ticket.assignedToName}</span>
          </div>
        )}
        {!showAssignee && ticket.submittedByName && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <User size={14} />
            <span className="font-['Abel',sans-serif]">{ticket.submittedByName}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}