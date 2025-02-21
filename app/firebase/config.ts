import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGZ602gpybqLGh4kgnkN8fQnR1CEJzKpY",
  authDomain: "nomikoi.firebaseapp.com",
  projectId: "nomikoi",
  storageBucket: "nomikoi.firebasestorage.app",
  messagingSenderId: "76587219288",
  appId: "1:76587219288:web:d8c45009b475619cedcd2d",
  measurementId: "G-F4SJ6WDG04"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// 各サービスのインスタンスを取得
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage }; 