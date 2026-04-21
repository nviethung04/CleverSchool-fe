import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyCNnVsg-4hdD7STtZHptGMIkH613g7LUsw",
    authDomain: "ed-lms.firebaseapp.com",
    projectId: "ed-lms",
    storageBucket: "ed-lms.firebasestorage.app",
    messagingSenderId: "574072475726",
    appId: "1:574072475726:web:2a0dc365c91dc389fa331f",
    measurementId: "G-LL7ZX9LKPN"
};

// Initialize Firebase (chỉ khởi tạo 1 lần)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: any = null;

// Khởi tạo messaging - DISABLED (not effective for browser push)
if (false && typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            messaging = getMessaging(app);
        }
    });
}

export { app, messaging };
