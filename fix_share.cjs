const fs = require('fs');
let code = fs.readFileSync('src/components/ReferralCentre.tsx', 'utf8');

// Add QRCode import
if (!code.includes("import { QRCodeSVG } from 'qrcode.react';")) {
  code = code.replace("import { db } from '../lib/firebase';", "import { db } from '../lib/firebase';\nimport { QRCodeSVG } from 'qrcode.react';");
}

// Find the insertion point: right after the stats dashboard div
const insertionPoint = "        </div>\n\n        {/* 3. Empty State or History */}";

const shareSection = `        </div>

        {/* Share Section */}
        <div className={\`flex flex-col md:flex-row items-center justify-center gap-8 p-8 rounded-3xl border \${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-sm'}\`}>
            {/* Copyable Code Area */}
            <div className="flex flex-col flex-1 max-w-sm w-full gap-2">
                <span className={\`text-xs font-bold uppercase tracking-wider \${isDark ? 'text-white/60' : 'text-slate-500'}\`}>Your Referral Code</span>
                <div className={\`flex justify-between items-center p-4 rounded-xl border border-dashed border-emerald-500 \${isDark ? 'bg-white/5' : 'bg-slate-50'}\`}>
                    <span className="font-mono font-bold text-lg text-emerald-500 tracking-wider">{user?.referralCode}</span>
                    <button 
                        onClick={() => copyToClipboard(user?.referralCode || '')} 
                        className="bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {copiedCode ? <Check size={16} /> : <Copy size={16} />} Copy
                    </button>
                </div>
            </div>

            {/* QR Code Area */}
            <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <QRCodeSVG 
                        value={referralLink} 
                        size={128} 
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"Q"}
                    />
                </div>
                <p className={\`text-sm font-bold \${isDark ? 'text-white/80' : 'text-slate-600'}\`}>Scan to invite friends</p>
            </div>
        </div>

        {/* 3. Empty State or History */}`;

code = code.replace(insertionPoint, shareSection);

fs.writeFileSync('src/components/ReferralCentre.tsx', code);
