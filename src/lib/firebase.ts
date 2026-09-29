import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  DocumentReference, 
  CollectionReference, 
  SetOptions, 
  WithFieldValue, 
  DocumentData,
  UpdateData 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function safeSetDoc<T extends DocumentData>(
  reference: DocumentReference<T>,
  data: WithFieldValue<T>,
  options?: SetOptions
) {
  try {
    if (options) {
      return await setDoc(reference, data, options);
    }
    return await setDoc(reference, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, reference.path);
  }
}

export async function safeAddDoc<T extends DocumentData>(
  reference: CollectionReference<T>,
  data: WithFieldValue<T>
) {
  try {
    return await addDoc(reference, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, reference.path);
  }
}

export async function safeUpdateDoc<T extends DocumentData>(
  reference: DocumentReference<T>,
  data: UpdateData<T>
) {
  try {
    return await updateDoc(reference, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, reference.path);
  }
}

export async function safeDeleteDoc<T extends DocumentData>(
  reference: DocumentReference<T>
) {
  try {
    return await deleteDoc(reference);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, reference.path);
  }
}
