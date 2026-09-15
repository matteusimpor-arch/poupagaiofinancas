import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

/**
 * Salva ou atualiza um documento no Firestore com tratamento de erro
 */
export async function saveToFirestore<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: T
): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    // Sanitização de campos undefined que o Firestore rejeita
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    await setDoc(doc(db, collectionName, id), cleanData, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Erro ao salvar em ${path}:`, error);
  }
}

/**
 * Remove um documento do Firestore
 */
export async function deleteFromFirestore(collectionName: string, id: string): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.warn(`[Firestore] Erro ao remover de ${path}:`, error);
  }
}

/**
 * Salva todo o conjunto de dados do usuário no Firestore para sincronização entre múltiplos dispositivos
 */
export async function saveUserDataToCloud(userId: string, data: any): Promise<void> {
  if (!userId) return;
  try {
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, 'user_app_data', userId), cleanData, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Erro ao salvar sincronização de dados do usuário ${userId}:`, error);
  }
}

/**
 * Escuta em tempo real alterações nos dados do usuário no Firestore
 */
export function subscribeToUserDataCloud(
  userId: string,
  onUpdate: (data: any) => void
): Unsubscribe {
  if (!userId) return () => {};
  try {
    return onSnapshot(
      doc(db, 'user_app_data', userId),
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data());
        }
      },
      (error) => {
        console.warn(`[Firestore] Erro no listener de sincronização do usuário ${userId}:`, error);
      }
    );
  } catch (error) {
    console.warn(`[Firestore] Falha ao registrar listener do usuário ${userId}:`, error);
    return () => {};
  }
}

/**
 * Busca uma coleção filtrando por space_id
 */
export async function fetchCollectionBySpace<T>(
  collectionName: string,
  spaceId: string
): Promise<T[]> {
  if (!auth.currentUser) {
    return [];
  }

  try {
    const q = query(collection(db, collectionName), where('space_id', '==', spaceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as T);
  } catch (error) {
    console.warn(`[Firestore] Erro ao buscar coleção ${collectionName}:`, error);
    return [];
  }
}

/**
 * Escuta em tempo real documentos de um espaço
 */
export function subscribeToSpaceCollection<T>(
  collectionName: string,
  spaceId: string,
  onUpdate: (items: T[]) => void
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }

  try {
    const q = query(collection(db, collectionName), where('space_id', '==', spaceId));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => docSnap.data() as T);
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
      }
    );
  } catch (error) {
    console.warn(`[Firestore] Falha ao registrar listener para ${collectionName}:`, error);
    return () => {};
  }
}

/**
 * Popula dados iniciais no Firestore para um espaço caso esteja vazio
 */
export async function seedSpaceDataIfEmpty(
  spaceId: string,
  data: {
    categories: any[];
    transactions: any[];
    goals: any[];
    investments: any[];
    wishlist: any[];
    plans: any[];
  }
): Promise<void> {
  // Somente executa a inicialização de dados quando houver um usuário autenticado no Firebase
  if (!auth.currentUser) {
    return;
  }

  try {
    const existing = await fetchCollectionBySpace('transactions', spaceId);
    if (existing.length === 0) {
      console.log(`[Firestore] Inicializando dados no banco para o espaço ${spaceId}...`);
      for (const cat of data.categories) {
        await saveToFirestore('categories', cat.id, { ...cat, space_id: spaceId });
      }
      for (const tx of data.transactions) {
        await saveToFirestore('transactions', tx.id, tx);
      }
      for (const g of data.goals) {
        await saveToFirestore('goals', g.id, g);
      }
      for (const inv of data.investments) {
        await saveToFirestore('investments', inv.id, inv);
      }
      for (const w of data.wishlist) {
        await saveToFirestore('wishlist', w.id, w);
      }
      for (const p of data.plans) {
        await saveToFirestore('monthly_plans', p.id, p);
      }
      console.log(`[Firestore] Dados iniciais salvos com sucesso!`);
    }
  } catch (error) {
    console.warn('[Firestore] Inicialização de dados ignorada ou falhou:', error);
  }
}

