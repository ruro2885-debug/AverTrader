sed -i "s/doc(db, 'notifications', id)/doc(db, 'users', userRef.current.uid, 'notifications', id)/g" src/contexts/AuthContext.tsx
sed -i 's/const notifPath = `users\/${userRef.current?.uid || firebaseUser?.uid}\/notifications`;/const notifPath = `users\/${userRef.current?.uid}\/notifications`;/' src/contexts/AuthContext.tsx
