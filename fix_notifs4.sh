sed -i 's/const notifPath = `users\/${userRef.current?.uid}\/notifications`;/const notifPath = `users\/${firebaseUser.uid}\/notifications`;/' src/contexts/AuthContext.tsx
