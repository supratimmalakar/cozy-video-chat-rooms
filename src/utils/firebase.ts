import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "webrtc-d151f.firebaseapp.com",
  projectId: "webrtc-d151f",
  storageBucket: "webrtc-d151f.firebasestorage.app",
  messagingSenderId: "88288153032",
  appId: import.meta.env.VITE_APP_ID,
  measurementId: "G-503X6KSEMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)