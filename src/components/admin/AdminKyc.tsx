import React from 'react';
import { ShieldCheck, UserCheck, AlertTriangle, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface AdminKycProps {
  theme: string;
}

export default function AdminKyc({ theme }: AdminKycProps) {
  const cardBg = theme === 'dark' ? 'bg-[#12161c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-amber-500/10 inline-block mb-2">
            Compliance & Verification
          </span>
          <h1 className="text-2xl font-black tracking-tight">KYC Review & Approvals</h1>
          <p className={`text-sm ${textSecondary} mt-1`}>
            Verify client identity documents, AML screening flags, and account accreditation tiers.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-bold font-mono">
            38 Pending Verifications
          </span>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Pending KYC Submissions</h3>
          <span className="text-xs font-mono text-amber-500">Tier 2 & Institutional</span>
        </div>

        <div className="space-y-4">
          {[
            { name: 'Sarah FinTech', email: 'sarah.fin@example.com', tier: 'Tier 2 (Enhanced)', submitted: '8 mins ago', docs: ['Passport', 'Proof of Address'] },
            { name: 'Marcus Vance', email: 'marcus.v@example.com', tier: 'Tier 3 (Institutional)', submitted: '42 mins ago', docs: ['Corporate Articles', 'Beneficial Ownership'] },
            { name: 'Elena Rostova', email: 'elena.rostova@example.com', tier: 'Tier 2 (Enhanced)', submitted: '2 hours ago', docs: ['Driver License', 'Bank Statement'] },
          ].map((item, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border ${theme === 'dark' ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'} flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4`}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-base shrink-0">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-base">{item.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500">{item.tier}</span>
                  </div>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>{item.email} • Submitted {item.submitted}</p>
                  <div className="flex items-center space-x-2 mt-3">
                    {item.docs.map((doc, dIdx) => (
                      <span key={dIdx} className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{doc}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
                <button className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition-colors">
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold transition-colors shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve KYC</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
