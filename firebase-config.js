// Firebase Configuration
// 
// To configure Firebase:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. Set up Realtime Database (Build → Realtime Database → Create Database)
// 3. Get your config from Project Settings → Your apps → Web app
// 4. Replace the placeholder values below

const firebaseConfig = {
    apiKey: "AIzaSyAwZEBH8RmwBD97rEPqoODbm05Cdfx8L0U",
    authDomain: "workarea-booking.firebaseapp.com",
    databaseURL: "https://workarea-booking-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "workarea-booking",
    storageBucket: "workarea-booking.firebasestorage.app",
    messagingSenderId: "98146383208",
    appId: "1:98146383208:web:682e6881829ef72e1212dd"
  };
  

// Enable Firebase storage
// Set to true to use Firebase Realtime Database for persistence
// Set to false to use localStorage only (default)
const useFirebaseStorage = true;

/**
 * Check if Firebase is properly configured
 * @returns {boolean} True if Firebase config has been set up
 */
function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
           firebaseConfig.databaseURL !== "https://your-project-default-rtdb.firebaseio.com" &&
           useFirebaseStorage === true;
}
