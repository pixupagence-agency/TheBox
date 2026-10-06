import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };

console.log("Testing connection to Firebase Firestore...");
console.log("Project ID:", firebaseConfig.projectId);
console.log("Database ID:", firebaseConfig.firestoreDatabaseId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkDb() {
  try {
    const configDocRef = doc(db, "app_config", "general");
    const snapshot = await getDoc(configDocRef);
    console.log("✅ SUCCESS: Successfully connected to Firebase Firestore!");
    console.log("Document exists?", snapshot.exists());
    if (snapshot.exists()) {
      console.log("Data:", snapshot.data());
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR: Connection failed:", error);
    process.exit(1);
  }
}

checkDb();
