import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD30JhUMgBtGD-mzvvnmbOt_wM3rvmjDns",
  authDomain: "brickvest-963ba.firebaseapp.com",
  projectId: "brickvest-963ba",
  storageBucket: "brickvest-963ba.firebasestorage.app",
  messagingSenderId: "634643159104",
  appId: "1:634643159104:web:1487440acb3f77f551a7a5"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);