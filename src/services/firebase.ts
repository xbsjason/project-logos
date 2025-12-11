import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAkJHpDURLir0cfxcCTAQTDpnwrRCJpayQ",
    authDomain: "project-logos-f6f12.firebaseapp.com",
    projectId: "project-logos-f6f12",
    storageBucket: "project-logos-f6f12.firebasestorage.app",
    messagingSenderId: "480162583284",
    appId: "1:480162583284:web:5c766eb9bf9002698904a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

