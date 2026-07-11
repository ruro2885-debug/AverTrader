const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// replace the notification listener
code = code.replace(/\/\/ Listen for real-time updates to notifications[\s\S]*?unsubNotifications = onSnapshot\(notifQuery, \(snapshot\) => \{[\s\S]*?\}\);/g, `// Real-time notifications are now handled by the user document listener`);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
