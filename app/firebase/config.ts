import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmexIsxeS66Kg3pZ1Tu4FWyJWL0YoRH1U",
  authDomain: "nomikoi-v0-dev.firebaseapp.com",
  projectId: "nomikoi-v0-dev",
  storageBucket: "nomikoi-v0-dev.firebasestorage.app",
  messagingSenderId: "857964305442",
  appId: "1:857964305442:web:36c75ff6855e5303373e7b"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 各サービスのインスタンスを取得
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage }; 