sed -i '294s/targetUserId/firebaseUser.uid/' src/contexts/AuthContext.tsx
sed -i '587s/targetUserId/userRef.current.uid/' src/contexts/AuthContext.tsx
sed -i '620s/targetUserId/userRef.current.uid/' src/contexts/AuthContext.tsx
