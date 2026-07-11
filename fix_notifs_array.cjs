const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// The code has:
// unsubNotifications = onSnapshot(notifQuery, (snapshot) => {
//   const notifs = snapshot.docs.map((doc) => ...
//   setNotifications(notifs);
// }, (error) => { ... });

code = code.replace(/\/\/ Listen for real-time updates to notifications[\s\S]*?unsubNotifications = onSnapshot\(notifQuery, \(snapshot\) => \{[\s\S]*?\}\);/g, `// Notifications are now parsed in the user document listener.`);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
