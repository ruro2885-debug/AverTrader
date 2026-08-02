import { collection, getDocs } from "firebase/firestore";
import { db } from "./src/lib/firebase";

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, "support_tickets"));
    console.log(`Found ${querySnapshot.size} tickets in Firestore.`);
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data().userId}`);
    });
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
