// Firebase configuration (Placeholder - Replace with your actual config from Firebase Console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "deffenso-lms.firebaseapp.com",
  projectId: "deffenso-lms",
  storageBucket: "deffenso-lms.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.db = firebase.firestore();
} else {
  console.warn("Firebase SDK not loaded. Proceeding in local mode.");
}
