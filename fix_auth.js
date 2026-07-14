import fs from 'fs';
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

// Undo mock user logic in auth state changed
code = code.replace(/\/\/ Check for mock user bypass\n\s*const storedMock = localStorage\.getItem\('mockUser'\);\n\s*if \(storedMock\) \{\n\s*setUser\(JSON\.parse\(storedMock\)\);\n\s*setLoading\(false\);\n\s*\} else \{\n\s*setUser\(null\);\n\s*setNotifications\(\[\]\);\n\s*setPreviewPhotoURL\(null\);\n\s*setLoading\(false\);\n\s*\}/, `setUser(null);\n        setNotifications([]);\n        setPreviewPhotoURL(null);\n        setLoading(false);`);

// Undo mock user in signUp
code = code.replace(/if \(innerError\.code === 'auth\/operation-not-allowed'\) \{[\s\S]*?\} else \{/, `if (innerError.code === 'auth/operation-not-allowed') {
          console.warn("Email/Password not enabled, falling back to Anonymous Auth");
          userCredential = await signInAnonymously(auth);
        } else {`);

// Undo mock user in signIn
code = code.replace(/if \(innerError\.code === 'auth\/operation-not-allowed'\) \{[\s\S]*?\} else \{/, `if (innerError.code === 'auth/operation-not-allowed') {
          console.warn("Email/Password not enabled, falling back to Anonymous Auth");
          userCredential = await signInAnonymously(auth);
        } else {`);

// Undo mock user in signOut
code = code.replace(/localStorage\.removeItem\('mockUser'\);\n\s*setUser\(null\);\n\s*/, '');

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
