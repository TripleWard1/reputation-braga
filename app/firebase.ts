import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'rep-braga.firebaseapp.com',
  projectId: 'rep-braga',
  storageBucket: 'rep-braga.firebasestorage.app',
  messagingSenderId: '1005855610893',
  appId: '1:1005855610893:web:6a3b484f56246accfddd44',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
