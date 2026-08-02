import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, getDocs, doc, getDocFromServer } from "firebase/firestore";
import firebaseAppletConfig from "./firebase-applet-config.json";

const app = initializeApp(firebaseAppletConfig);

// Try initializing without databaseId if it's "(default)"
const dbId = firebaseAppletConfig.firestoreDatabaseId === "(default)" ? undefined : firebaseAppletConfig.firestoreDatabaseId;
const db = initializeFirestore(app, {}, dbId);

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, "support_tickets"));
    console.log(`Found ${querySnapshot.size} tickets in Firestore.`);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
