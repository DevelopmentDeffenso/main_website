// Firebase configuration (Placeholder - Replace with your actual config from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDBxy-YvtpUXKzpJPz5qQ2MFH_i1ba0kWw",
  authDomain: "deffenso-academy-lms-v1.firebaseapp.com",
  projectId: "deffenso-academy-lms-v1",
  storageBucket: "deffenso-academy-lms-v1.firebasestorage.app",
  messagingSenderId: "333169056174",
  appId: "1:333169056174:web:dc3cbe29e4db1f3419503f"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.db = firebase.firestore();
} else {
  console.warn("Firebase SDK not loaded. Proceeding in local mode.");
}
