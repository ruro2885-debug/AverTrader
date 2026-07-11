const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(/setUser\(\{[\s\S]*?\}\);/, `setUser({
              ...userData,
              notificationsList: userData.notificationsList || [],
              history: userData.history || [],
              deposits: userData.deposits || [],
              withdrawals: userData.withdrawals || [],
              portfolio: userData.portfolio || {
                totalValue: 0,
                todayPnL: 0,
                todayPnLPercent: 0,
                overallReturn: 0
              }
            });
            const notifs = userData.notificationsList || [];
            notifs.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
            setNotifications(notifs);`);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
