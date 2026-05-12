import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            "AIzaSyBVzWCw4WwKvfxihqKtl_RialueCj-qcsI",
  authDomain:        "nouri-e81e6.firebaseapp.com",
  projectId:         "nouri-e81e6",
  storageBucket:     "nouri-e81e6.firebasestorage.app",
  messagingSenderId: "584983175131",
  appId:             "1:584983175131:web:fddd8fa4306ce42828d1fe",
  measurementId:     "G-XJPNYWR4TS",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;