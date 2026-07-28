import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseAppletConfig from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = firebaseAppletConfig.firestoreDatabaseId
  ? initializeFirestore(app, { localCache: memoryLocalCache() }, firebaseAppletConfig.firestoreDatabaseId)
  : initializeFirestore(app, { localCache: memoryLocalCache() });
export const storage = getStorage(app);

// Validate connection to Firestore on initialization as recommended in skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('offline') || msg.includes('could not reach') || msg.includes('unavailable')) {
        console.warn("[Firebase] Operating in offline/cached mode or backend unavailable.");
      }
    }
  }
}
testConnection();

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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Notice / Error handled: ', JSON.stringify(errInfo));
  const lowerMsg = errMessage.toLowerCase();
  if (
    lowerMsg.includes('offline') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('resource-exhausted') ||
    lowerMsg.includes('permission-denied') ||
    lowerMsg.includes('could not reach') ||
    lowerMsg.includes('backend didn\'t respond')
  ) {
    return;
  }
  throw new Error(JSON.stringify(errInfo));
}

export default app;
