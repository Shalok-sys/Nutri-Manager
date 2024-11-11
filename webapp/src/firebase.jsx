// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase} from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAy5MC9_JM_FSojkgaRgS-w2MoGB1HFNo",
  authDomain: "nutri-manager-c6779.firebaseapp.com",
  databaseURL: "https://nutri-manager-c6779-default-rtdb.firebaseio.com",
  projectId: "nutri-manager-c6779",
  storageBucket: "nutri-manager-c6779.firebasestorage.app",
  messagingSenderId: "198034564631",
  appId: "1:198034564631:web:7b328f9955297bd1cede52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;