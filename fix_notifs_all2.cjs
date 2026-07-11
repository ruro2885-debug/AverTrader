const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// Replace markNotificationRead
code = code.replace(/const markNotificationRead = useCallback\(async \(id: string, readState\?: boolean\) => \{[\s\S]*?\}, \[\]\);/, `const markNotificationRead = useCallback(async (id: string, readState?: boolean) => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, read: readState !== undefined ? readState : !n.read } : n);
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, \`users/\$\{userRef.current.uid\}\`);
      }
    }
  }, []);`);

// Replace markAllNotificationsRead
code = code.replace(/const markAllNotificationsRead = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/, `const markAllNotificationsRead = useCallback(async () => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.map(n => ({ ...n, read: true }));
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, \`users/\$\{userRef.current.uid\}\`);
      }
    }
  }, []);`);

// Replace deleteNotification
code = code.replace(/const deleteNotification = useCallback\(async \(id: string\) => \{[\s\S]*?\}, \[\]\);/, `const deleteNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.filter(n => n.id !== id);
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, \`users/\$\{userRef.current.uid\}\`);
      }
    }
  }, []);`);

// Replace clearNotifications
code = code.replace(/const clearNotifications = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/, `const clearNotifications = useCallback(async () => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.filter(n => n.pinned); // Keep pinned ones
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, \`users/\$\{userRef.current.uid\}\`);
      }
    }
  }, []);`);

// Replace pinNotification
code = code.replace(/const pinNotification = useCallback\(async \(id: string\) => \{[\s\S]*?\}, \[\]\);/, `const pinNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, \`users/\$\{userRef.current.uid\}\`);
      }
    }
  }, []);`);

// Replace archiveNotification
code = code.replace(/const archiveNotification = useCallback\(async \(id: string\) => \{[\s\S]*?\}, \[\]\);/, `const archiveNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, archived: !n.archived } : n);
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, \`users/\$\{userRef.current.uid\}\`);
      }
    }
  }, []);`);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
