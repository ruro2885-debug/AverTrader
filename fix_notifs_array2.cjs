const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// Replace the residual code
code = code.replace(/\/\/ Notifications are now parsed in the user document listener\.[\s\S]*?handleFirestoreError\(error, OperationType\.GET, notifPath\);\n\s*\}\);/g, `// Notifications are now parsed in the user document listener.`);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
