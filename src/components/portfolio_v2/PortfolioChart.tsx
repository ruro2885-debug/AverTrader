import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart2, 
  Settings, 
  Maximize2, 
  Minimize2, 
  TrendingUp, 
  Eye, 
  Sliders, 
  Activity,
  GitCompare,
  TrendingDown,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PortfolioSnapshot, TradeHistoryItem } from '../../types';

interface ChartPoint {
  time: string;
  timestamp: number;
  value: number;
  pnl?: number;
  event?: TradeHistoryItem;
}

export default function PortfolioChart({ theme }: { theme: 'light' | 'dark' }) {
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const [timeframe, setTimeframe] = useState<string>('1M');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Crosshair state
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 350 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDims({ width: width || 800, height: height || 350 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter and prepare data based on timeframe
  const chartData = useMemo(() => {
    if (!user?.snapshots) return [];
    
    const now = new Date();
    let filterDate = new Date();
    
    switch (timeframe) {
      case '1D': filterDate.setDate(now.getDate() - 1); break;
      case '7D': filterDate.setDate(now.getDate() - 7); break;
      case '1M': filterDate.setMonth(now.getMonth() - 1); break;
      case '3M': filterDate.setMonth(now.getMonth() - 3); break;
      case '6M': filterDate.setMonth(now.getMonth() - 6); break;
      case '1Y': filterDate.setFullYear(now.getFullYear() - 1); break;
      case 'ALL': filterDate = new Date(0); break;
      default: filterDate.setMonth(now.getMonth() - 1);
    }

    const filteredSnapshots = user.snapshots
      .filter(s => new Date(s.timestamp).getTime() >= filterDate.getTime())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return filteredSnapshots.map(s => {
      const ts = new Date(s.timestamp).getTime();
      // Find events close to this snapshot timestamp
      const event = user.trades?.find(t => {
        const tts = t.timestamp?.seconds ? t.timestamp.seconds * 1000 : (t.timestamp instanceof Date ? t.timestamp.getTime() : new Date(t.timestamp).getTime());
        return Math.abs(tts - ts) < 12 * 60 * 60 * 1000; // 12h window
      });

      return {
        time: new Date(s.timestamp).toLocaleDateString(),
        timestamp: ts,
        value: s.totalValue,
        pnl: s.unrealizedPnl + s.realizedPnl,
        event
      } as ChartPoint;
    });
  }, [user?.snapshots, user?.trades, timeframe]);

  // Canvas Drawing Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;
    ctx.scale(dpr, dpr);

    const w = dims.width;
    const h = dims.height;
    const padding = 40;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2;

    ctx.clearRect(0, 0, w, h);
    
    // Background
    ctx.fillStyle = isDark ? '#08080c' : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const values = chartData.map(d => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal;

    const getX = (idx: number) => padding + (idx / (chartData.length - 1)) * chartW;
    const getY = (val: number) => h - padding - ((val - minVal) / range) * chartH;

    // Gridlines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = getY(minVal + (range * i) / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
      
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`$${(minVal + (range * i) / 4).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, padding - 5, y + 3);
    }

    // Line Path
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    chartData.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area Fill
    const grad = ctx.createLinearGradient(0, padding, 0, h - padding);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = grad;
    ctx.lineTo(getX(chartData.length - 1), h - padding);
    ctx.lineTo(getX(0), h - padding);
    ctx.closePath();
    ctx.fill();

    // Event Markers
    chartData.forEach((d, i) => {
      if (d.event) {
        const x = getX(i);
        const y = getY(d.value);
        const isBuy = d.event.side === 'buy' || d.event.side === 'deposit';
        
        ctx.fillStyle = isBuy ? '#10b981' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Crosshair
    if (hoveredPoint && crosshairPos) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(crosshairPos.x, padding);
      ctx.lineTo(crosshairPos.x, h - padding);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(crosshairPos.x, getY(hoveredPoint.value), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

  }, [chartData, dims, isDark, hoveredPoint, crosshairPos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (chartData.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const padding = 40;
    const chartW = dims.width - padding * 2;
    const idx = Math.round(((x - padding) / chartW) * (chartData.length - 1));
    
    if (idx >= 0 && idx < chartData.length) {
      const point = chartData[idx];
      const pointX = padding + (idx / (chartData.length - 1)) * chartW;
      
      const values = chartData.map(d => d.value);
      const minVal = Math.min(...values) * 0.95;
      const maxVal = Math.max(...values) * 1.05;
      const range = maxVal - minVal;
      const pointY = dims.height - padding - ((point.value - minVal) / range) * (dims.height - padding * 2);
      
      setHoveredPoint(point);
      setCrosshairPos({ x: pointX, y: pointY });
    }
  };

  return (
    <div className={`w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-black w-screen h-screen' : ''}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-black tracking-tight">Portfolio Value</h3>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Historical Intelligence Index</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${timeframe === tf ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              {tf}
            </button>
          ))}
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="ml-2 p-2 text-slate-400 hover:text-white">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef} 
        className="relative w-full bg-[#08080c] cursor-crosshair"
        style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '350px' }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHoveredPoint(null); setCrosshairPos(null); }}
          className="w-full h-full"
        />

        {/* Floating Intelligence Overlay (Crosshair Metadata) */}
        {hoveredPoint && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-10 w-64 pointer-events-none animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{hoveredPoint.time}</span>
              {hoveredPoint.event && (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${hoveredPoint.event.side === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {hoveredPoint.event.side} EVENT
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Portfolio Value:</span>
                <span className="text-sm font-black text-white">${hoveredPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Total P/L:</span>
                <span className={`text-sm font-black ${hoveredPoint.pnl && hoveredPoint.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hoveredPoint.pnl && hoveredPoint.pnl >= 0 ? '+' : ''}${hoveredPoint.pnl?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {hoveredPoint.event && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                <div className="flex items-center space-x-1.5 mb-2">
                  <Activity size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-black text-white uppercase">Trading Event</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-500">Asset:</span> {hoveredPoint.event.ticker}
                </div>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-500">Action:</span> {hoveredPoint.event.side.toUpperCase()} @ ${hoveredPoint.event.price}
                </div>
                {hoveredPoint.event.reason && (
                  <div className="text-[10px] text-slate-400 italic mt-1 leading-tight">
                    "{hoveredPoint.event.reason}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tiny Event Timeline Summary */}
      <div className="px-6 py-3 bg-white/[0.01] border-t border-white/5 flex items-center space-x-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-2 shrink-0">
          <Info size={12} className="text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Recent Events:</span>
        </div>
        {user?.trades?.slice(0, 5).map(t => (
          <div key={t.id} className="flex items-center space-x-2 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${t.side === 'buy' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-[10px] font-bold text-white uppercase">{t.ticker} {t.side}</span>
            <span className="text-[9px] font-mono text-slate-500">${t.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
