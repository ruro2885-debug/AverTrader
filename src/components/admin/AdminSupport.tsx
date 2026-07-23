import React, { useState } from 'react';
import { HelpCircle, MessageSquare, CheckCircle, Clock, Search, Filter } from 'lucide-react';

interface AdminSupportProps {
  theme: string;
}

export default function AdminSupport({ theme }: AdminSupportProps) {
  const cardBg = theme === 'dark' ? 'bg-[#12161c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <span className="text-xs font-mono font-bold text-blue-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-blue-500/10 inline-block mb-2">
            Support Operations
          </span>
          <h1 className="text-2xl font-black tracking-tight">Customer Support & Tickets</h1>
          <p className={`text-sm ${textSecondary} mt-1`}>
            Manage incoming client inquiries, support queues, and dispute resolution tickets.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {(['all', 'open', 'resolved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === tab 
                  ? 'bg-emerald-500 text-slate-950 shadow-md' 
                  : `${cardBg} hover:opacity-80`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ticket ID, user email..." 
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm bg-transparent ${theme === 'dark' ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'} focus:outline-none focus:border-emerald-500`}
            />
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium">
            <span className={textSecondary}>Showing active support queue</span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: 'TKT-1042', user: 'elena.rostova@example.com', subject: 'API Rate limit configuration query', priority: 'High', status: 'Open', time: '25 mins ago' },
            { id: 'TKT-1041', user: 'jason.m@example.com', subject: 'Two-factor authentication reset request', priority: 'Medium', status: 'Open', time: '1 hour ago' },
            { id: 'TKT-1040', user: 'david.c@example.com', subject: 'Deposit settlement inquiry for wire transfer', priority: 'Low', status: 'Resolved', time: '3 hours ago' },
          ].map(ticket => (
            <div key={ticket.id} className={`p-4 rounded-xl border ${theme === 'dark' ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-500/40 transition-all`}>
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-500">{ticket.id}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${ticket.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : ticket.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {ticket.priority} Priority
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mt-1">{ticket.subject}</h4>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>Client: {ticket.user} • Created {ticket.time}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${ticket.status === 'Open' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {ticket.status}
                </span>
                <button className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors">
                  Respond
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
