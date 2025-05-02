import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Add this!
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDpib3C8rpHxhjq2cUWNPCXL2gxrm6KtRU",
  authDomain: "psms-app.firebaseapp.com",
  projectId: "psms-app",
  storageBucket: "psms-app.firebasestorage.app",
  messagingSenderId: "695525318635",
  appId: "1:695525318635:web:b0b2e0e3cc7be5d9fb03ae",
  measurementId: "G-K1CRLL0TCY",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// --- ADD THIS FOR SUPPLIES MANAGEMENT ---
const db = getFirestore(app);

export { auth, db };
