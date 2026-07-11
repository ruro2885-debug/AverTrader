const fs = require('fs');
let code = fs.readFileSync('src/components/ReferralCentre.tsx', 'utf8');

const regex = /catch \(err\) \{\s*console\.error\("Error fetching referrals:", err\);\s*\}/;

const newCatch = `catch (err: any) {
        if (err?.code === 'permission-denied') {
          console.warn("Referral feature is disabled: Firebase rules need to be updated by the project owner.");
        } else {
          console.error("Error fetching referrals:", err);
        }
      }`;

code = code.replace(regex, newCatch);
fs.writeFileSync('src/components/ReferralCentre.tsx', code);
