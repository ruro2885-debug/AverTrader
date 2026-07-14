import fs from 'fs';
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(/try \{\n\s*userCredential = await createUserWithEmailAndPassword\(auth, data\.email, data\.password\);\n\s*\} catch \(innerError: any\) \{\n\s*if \(innerError\.code === 'auth\/operation-not-allowed'\) \{\n\s*console\.warn\("Email\/Password not enabled, falling back to Anonymous Auth"\);\n\s*await signInAnonymously\(auth\);\n\s*\} else \{/g, `try {
        userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      } catch (innerError: any) {
        if (innerError.code === 'auth/operation-not-allowed') {
          console.warn("Email/Password not enabled, falling back to Anonymous Auth");
          userCredential = await signInAnonymously(auth);
        } else {`);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
