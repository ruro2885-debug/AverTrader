export default function AdminRoot({ theme: _theme }: { theme?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">AVER Sovereign Admin Terminal</h1>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="text-xs text-slate-400">Total Users</div>
          <div className="text-2xl font-bold text-white mt-1">12,480</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="text-xs text-slate-400">Pending KYC</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">14</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="text-xs text-slate-400">System Status</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">Optimal</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="text-xs text-slate-400">Security Level</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">Maximum</div>
        </div>
      </div>
    </div>
  );
}
