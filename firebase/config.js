import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Add this!
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
 
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// --- ADD THIS FOR SUPPLIES MANAGEMENT ---
const db = getFirestore(app);

export { auth, db };
