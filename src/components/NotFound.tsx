import React from 'react';
import { Home } from 'lucide-react';
import bgMobile from '../assets/images/admin_404_cube_bg_1790754808719.jpg';
import bgDesktop from '../assets/images/admin_404_cube_desktop_1790754826768.jpg';

export default function NotFound({ onBack }: { onBack?: () => void }) {
  const handleHome = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#030612] text-white select-none">
      {/* 3D Isometric Server Cube Field Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <picture>
          <source media="(min-width: 768px)" srcSet={bgDesktop} />
          <img 
            src={bgMobile} 
            alt="3D Futuristic Server Grid" 
            className="w-full h-full object-cover object-center opacity-85 scale-105 filter contrast-125 brightness-90"
            referrerPolicy="no-referrer"
          />
        </picture>

        {/* Deep Dark Vignette and Atmospheric Lighting Scrims */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02050d]/80 via-[#030716]/40 to-[#02050d]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#02050d_95%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="max-w-lg w-full text-center relative z-10 flex flex-col items-center justify-center my-auto">
        <h1 
          className="text-[130px] sm:text-[180px] md:text-[220px] font-extrabold leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white/90 via-white/60 to-white/20 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 mb-3"
          style={{
            WebkitTextStroke: '1px rgba(255, 255, 255, 0.15)',
            paintOrder: 'stroke fill'
          }}
        >
          404
        </h1>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
          Page Not Found
        </h2>

        <p className="text-sm sm:text-base text-slate-300/80 font-medium max-w-xs sm:max-w-md mx-auto leading-relaxed mb-8 drop-shadow">
          The page you are looking for does not exist.
        </p>

        <button 
          onClick={handleHome}
          className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 backdrop-blur-xl text-white font-bold text-sm transition-all shadow-2xl flex items-center justify-center gap-2.5 mx-auto hover:border-white/40 cursor-pointer"
        >
          <Home className="w-4 h-4 text-white/90" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}

