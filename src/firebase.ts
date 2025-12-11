import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfCZesejLkwmJb86cG3cD5zwCTW5541jU",
  authDomain: "threefold-bastion.firebaseapp.com",
  projectId: "threefold-bastion",
  storageBucket: "threefold-bastion.firebasestorage.app",
  messagingSenderId: "435555769366",
  appId: "1:435555769366:web:6c0575f269fdc347552937",
  measurementId: "G-V4R48CL3ZE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
