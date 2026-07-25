import React, { useState, useEffect } from 'react';
import { Ticket, Search, Clock, CheckCircle2, User, MoreVertical, MessageSquare } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function AdminSupport({ theme }: { theme: 'light' | 'dark' }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = adminService.subscribeSupportTickets(setTickets);
    return unsub;
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support Operations</h2>
          <p className="text-sm text-slate-500">Respond to user inquiries and resolve technical tickets.</p>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center p-12">
        <Ticket className="w-16 h-16 text-slate-800 mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">No Support Tickets Available</h3>
        <p className="text-slate-500 max-w-sm">All user tickets have been resolved or the platform is currently at zero inquiry load.</p>
      </div>
    </div>
  );
}
