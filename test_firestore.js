import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDA2AcnxhGzSCdNClHFpF3rn2Af0ucWF94",
  authDomain: "aver-d2136.firebaseapp.com",
  projectId: "aver-d2136",
  storageBucket: "aver-d2136.firebasestorage.app",
  messagingSenderId: "813693230408",
  appId: "1:813693230408:web:be51499481b3fe0b0e277d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  try {
    await signInWithEmailAndPassword(auth, "rusdt9633@gmail.com", "Password123!");
    console.log("Logged in!");
    
    try {
      const d = await getDoc(doc(db, "users", auth.currentUser.uid));
      console.log("Got user doc:", d.exists());
    } catch(e) {
      console.error("user doc error:", e.message);
    }

    try {
      const q = await getDocs(collection(db, "users", auth.currentUser.uid, "notifications"));
      console.log("Got notifications:", q.size);
    } catch(e) {
      console.error("notifications error:", e.message);
    }

    try {
      const q = await getDocs(collection(db, "notifications"));
      console.log("Got root notifications:", q.size);
    } catch(e) {
      console.error("root notifications error:", e.message);
    }
  } catch(e) {
    console.error(e);
  }
}
test();
