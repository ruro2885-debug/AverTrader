sed -i 's/const notifPath = `users\/${firebaseUser.uid}\/notifications`;/const notifPath = `notifications`;/' src/contexts/AuthContext.tsx
sed -i 's/const notifPath = `users\/${targetUserId}\/notifications`;/const notifPath = `notifications`;/' src/contexts/AuthContext.tsx
sed -i 's/const notifPath = `users\/${userRef.current.uid}\/notifications\/${id}`;/const notifPath = `notifications\/${id}`;/' src/contexts/AuthContext.tsx
sed -i 's/const notifPath = `users\/${userRef.current.uid}\/notifications`;/const notifPath = `notifications`;/' src/contexts/AuthContext.tsx
sed -i "s/doc(db, 'users', userRef.current.uid, 'notifications', id)/doc(db, 'notifications', id)/g" src/contexts/AuthContext.tsx
