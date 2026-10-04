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

// Autenticação do administrador (necessária para gravar, segundo as regras do Firestore).
// Só é iniciada no browser e quando é pedida: durante a compilação (servidor) não existe, e
// se a configuração estiver incompleta devolve null em vez de partir a aplicação.
import { getAuth, type Auth } from 'firebase/auth';
let authInstancia: Auth | null = null;
export function obterAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (authInstancia) return authInstancia;
  try { authInstancia = getAuth(app); } catch { authInstancia = null; }
  return authInstancia;
}
