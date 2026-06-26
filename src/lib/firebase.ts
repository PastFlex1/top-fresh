import { initializeApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHSLcfS19P5gBulmGAgKJ8r4gddELnAkE",
  authDomain: "carniceria-512b5.firebaseapp.com",
  projectId: "carniceria-512b5",
  storageBucket: "carniceria-512b5.firebasestorage.app",
  messagingSenderId: "604105685937",
  appId: "1:604105685937:web:5cd2ce0f2bf32aeb511b90",
  measurementId: "G-KJZ89FRCF9"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache()
});
