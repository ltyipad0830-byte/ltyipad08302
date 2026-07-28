import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXrKi4aRxokPSIaflsZFcuWDrHo5rdFnQ",
  authDomain: "lecture-a7915.firebaseapp.com",
  projectId: "lecture-a7915",
  storageBucket: "lecture-a7915.firebasestorage.app",
  messagingSenderId: "235676860540",
  appId: "1:235676860540:web:1ed3d95d0b3b519dc6c9f9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
