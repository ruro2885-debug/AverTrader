sed -i 's/const notifPath = `notifications`;/const notifPath = `users\/${userRef.current?.uid || firebaseUser?.uid}\/notifications`;/' src/contexts/AuthContext.tsx
sed -i 's/const notifPath = `notifications\/${id}`;/const notifPath = `users\/${userRef.current?.uid}\/notifications\/${id}`;/' src/contexts/AuthContext.tsx
