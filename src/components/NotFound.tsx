export default function NotFound({ onBack }: any) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-black text-amber-500 mb-4">404</h1>
      <p className="text-slate-400 mb-6">The requested institutional terminal endpoint does not exist.</p>
      <button onClick={onBack} className="px-6 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl">Return to Home</button>
    </div>
  );
}
