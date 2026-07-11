const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const headerRegex = /<header className="flex justify-between items-center mb-6 pt-4 px-4 sm:px-0">[\s\S]*?<\/header>/;

const newHeader = `<header className={\`fixed top-0 left-0 right-0 h-[50px] flex justify-between items-center px-4 z-50 \${isDark ? 'bg-[#08080c]/80 backdrop-blur-md border-b border-white/5' : 'bg-slate-50/80 backdrop-blur-md border-b border-slate-200'}\`}>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-[1.5px] hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer animate-in fade-in zoom-in duration-300"
              >
                <div className={\`w-full h-full rounded-full overflow-hidden flex items-center justify-center \${isDark ? 'bg-slate-950' : 'bg-white'}\`}>
                  {authLoading ? (
                    <div className="w-full h-full animate-pulse bg-slate-700" />
                  ) : (
                    <img 
                      src={user?.profilePhotoURL || user?.photoURL || getDefaultAvatarURL(user?.username || user?.email || 'default')} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </button>
              <div>
                {authLoading ? (
                  <div className="w-20 h-4 rounded animate-pulse bg-slate-700" />
                ) : (
                  <h1 className={\`text-sm font-bold tracking-tight \${textPrimary}\`}>
                    {user?.username || user?.email?.split('@')[0] || 'User'}
                  </h1>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setShowNotificationsModal(true)}
              className={\`w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer relative \${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}\`}
            >
              <Bell className={\`w-4 h-4 \${textPrimary}\`} />
              {notifications && notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white ring-2 ring-slate-950">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </header>`;

code = code.replace(headerRegex, newHeader);

// Now adjust the top padding of the main container so the fixed header doesn't obscure content.
// The main wrapper has a class that depends on activeTab:
// <div className={\`relative z-10 p-0 sm:p-0 lg:max-w-none lg:mx-0 pt-safe \${activeTab === 'home' || activeTab === 'profile' || activeTab === 'discover' ? 'p-4 sm:p-6 lg:max-w-5xl lg:mx-auto' : ''}\`}>
// We need to add pt-[50px] or pt-14

const wrapperRegex = /<div className=\{\`relative z-10 p-0 sm:p-0 lg:max-w-none lg:mx-0 pt-safe \$\{activeTab === 'home' \|\| activeTab === 'profile' \|\| activeTab === 'discover' \? 'p-4 sm:p-6 lg:max-w-5xl lg:mx-auto' : ''\}\`\}>/;
const newWrapper = `<div className={\`relative z-10 p-0 sm:p-0 lg:max-w-none lg:mx-0 pt-safe \${activeTab !== 'markets' && activeTab !== 'coin-details' && activeTab !== 'portfolio' ? 'pt-[60px]' : ''} \${activeTab === 'home' || activeTab === 'profile' || activeTab === 'discover' ? 'p-4 sm:p-6 lg:max-w-5xl lg:mx-auto' : ''}\`}>`;

code = code.replace(wrapperRegex, newWrapper);

fs.writeFileSync('src/components/Dashboard.tsx', code);
