// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGj_86BNEUuvZrFY65k5cEcgYfSLQiczY",
  authDomain: "smartcowcollar.firebaseapp.com",
  projectId: "smartcowcollar",
  storageBucket: "smartcowcollar.firebasestorage.app",
  messagingSenderId: "215672417719",
  appId: "1:215672417719:web:37f15833f48d618493cc32",
  measurementId: "G-ECR68C4T33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);