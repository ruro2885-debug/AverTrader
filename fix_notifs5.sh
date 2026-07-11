sed -i 's/const notifPath = `users\/${firebaseUser.uid}\/notifications`;/const notifPath = `users\/${targetUserId}\/notifications`;/' src/contexts/AuthContext.tsx
