// Fotografia de fundo de Braga (a mesma da Visão Geral), carregada uma só vez e partilhada
// pela barra lateral, Observatório, ecrã de entrada e login.
import { doc, getDoc, getDocs, collection, query, limit } from 'firebase/firestore';
import { db } from '../firebase';

let pedido: Promise<string | null> | null = null;

export function obterFotoBraga(): Promise<string | null> {
  if (pedido) return pedido;
  const novo: Promise<string | null> = getDoc(doc(db, 'locationPhotos', '__braga'))
    .then(async (d: any) => {
      if (d.exists() && (d.data() as any).data) return (d.data() as any).data as string;
      // Ainda sem fotografia de Braga: usa a de um monumento já carregado
      const snap: any = await getDocs(query(collection(db, 'locationPhotos'), limit(2)));
      let foto: string | null = null;
      snap.forEach((x: any) => { if (!foto && x.id !== '__braga' && x.data()?.data) foto = x.data().data; });
      return foto;
    })
    .catch(() => null);
  pedido = novo;
  return novo;
}

/** Depois de carregar uma nova fotografia de fundo, força nova leitura. */
export function limparFotoBraga() { pedido = null; }
