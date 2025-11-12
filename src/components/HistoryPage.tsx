import TicketCard from './TicketCard';
import { Ticket } from '../lib/types';

interface HistoryPageProps {
  onViewTicket: (ticketId: string) => void;
  tickets: any[];
}

export default function HistoryPage({ onViewTicket, tickets }: HistoryPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Josefin_Sans',sans-serif] text-2xl text-gray-900 mb-1">
          Ticket History
        </h2>
        <p className="text-sm text-gray-500 font-['Abel',sans-serif]">
          View all tickets including resolved and closed ones
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tickets.map((ticket) => (
              <TicketCard 
                key={ticket.id}
                ticket={ticket} 
                onClick={() => onViewTicket(ticket.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 font-['Abel',sans-serif]">No tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
