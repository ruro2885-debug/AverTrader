const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(/export interface NotificationItem \{[\s\S]*?body: string;/, `export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  createdAtTimestamp: number;`);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
