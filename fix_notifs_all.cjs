const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// Replace addNotification
code = code.replace(/const notifPath = `users\/\$\{targetUserId\}\/notifications`;[\s\S]*?handleFirestoreError\(err, OperationType\.CREATE, notifPath\);\n\s*\}/, `const userDocRef = doc(db, 'users', targetUserId);
      console.log(\`[DEBUG_NOTIFICATION] Creating notification for \$\{targetUserId\}: "\$\{title\}" - "\$\{body\}" (category: \$\{category\}, priority: \$\{priority\})\`);
      try {
        const newNotif = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          userId: targetUserId,
          category,
          priority,
          title,
          body,
          read: false,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAtTimestamp: Date.now(),
          actionUrl: actionUrl || '',
          action: action || null,
          metadata: metadata || {},
          pinned: false,
          archived: false,
        };
        const { arrayUnion } = await import('firebase/firestore');
        await updateDoc(userDocRef, {
          notificationsList: arrayUnion(newNotif)
        });
        console.log(\`[DEBUG_NOTIFICATION_SUCCESS] Notification successfully saved to Firestore for user \$\{targetUserId\}\`);
      } catch (err) {
        console.error(\`[DEBUG_NOTIFICATION_ERROR] Failed to write notification to Firestore for user \$\{targetUserId\}:\`, err);
        handleFirestoreError(err, OperationType.UPDATE, \`users/\$\{targetUserId\}\`);
      }`);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
