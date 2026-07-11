const fs = require('fs');
let code = fs.readFileSync('src/components/ReferralCentre.tsx', 'utf8');

const regex = /catch \(err: any\) \{[\s\S]*?\} finally \{/;

const newCatch = `catch (err: any) {
        if (err?.code === 'permission-denied' || (err?.message && err.message.includes('Missing or insufficient permissions'))) {
          console.warn("Referral feature is disabled: Firebase rules need to be updated by the project owner.", err.message);
        } else {
          console.error("Error fetching referrals:", err);
        }
      } finally {`;

code = code.replace(regex, newCatch);
fs.writeFileSync('src/components/ReferralCentre.tsx', code);
