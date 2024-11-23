// Import the functions you need from the SDKs you need
import app from "firebase/compat/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import "firebase/compat/auth";
import "firebase/compat/database";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_nzzJNsuDAvzDu2jdM2WLtjrI6H94sV0",
  authDomain: "whatsappclone-95d36.firebaseapp.com",
  databaseURL: "https://whatsappclone-95d36-default-rtdb.firebaseio.com",
  projectId: "whatsappclone-95d36",
  storageBucket: "whatsappclone-95d36.firebasestorage.app",
  messagingSenderId: "794230029906",
  appId: "1:794230029906:web:ff1f1c840030f2fb94298b"
};

// Initialize Firebase
const firebase = app.initializeApp(firebaseConfig);
export default firebase;