import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { Document, Folder } from '../types';
import LZString from 'lz-string';

// --- Documents ---

export const subscribeToDocuments = (userId: string, callback: (docs: Document[]) => void) => {
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId),
    orderBy('lastModified', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Document));
    callback(documents);
  });
};

export const createDocument = async (userId: string, folderId: string | null = null) => {
  const newDoc = {
    userId,
    folderId,
    title: '',
    content: '',
    preview: 'Empty draft...',
    lastModified: Date.now()
  };

  const docRef = await addDoc(collection(db, 'documents'), newDoc);
  return { id: docRef.id, ...newDoc };
};

export const updateDocument = async (docId: string, data: Partial<Document>) => {
  const docRef = doc(db, 'documents', docId);
  await updateDoc(docRef, {
    ...data,
    lastModified: Date.now()
  });
};

export const deleteDocument = async (docId: string) => {
  await deleteDoc(doc(db, 'documents', docId));
};

// --- Versioning ---

export const saveDocumentVersion = async (docId: string, content: string, title: string) => {
  const compressed = LZString.compressToUTF16(content);
  await addDoc(collection(db, `documents/${docId}/versions`), {
    content: compressed,
    title,
    createdAt: Date.now()
  });
};

export const getDocumentVersions = async (docId: string) => {
  const q = query(
    collection(db, `documents/${docId}/versions`),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      content: LZString.decompressFromUTF16(data.content)
    };
  });
};

// --- Folders ---

export const subscribeToFolders = (userId: string, callback: (folders: Folder[]) => void) => {
  const q = query(
    collection(db, 'folders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Folder));
    callback(folders);
  });
};

export const createFolder = async (userId: string, name: string) => {
  const newFolder = {
    userId,
    name,
    createdAt: Date.now()
  };
  await addDoc(collection(db, 'folders'), newFolder);
};

export const deleteFolder = async (folderId: string) => {
  // 1. Delete the folder
  await deleteDoc(doc(db, 'folders', folderId));

  // 2. Move documents inside this folder to root (or delete them, but moving to root is safer)
  // Note: For a production app, use a batch or transaction.
  // We'll leave the docs pointing to a non-existent folder for now, 
  // but the UI should handle "orphaned" docs by showing them at root or handling the cleanup.
  // A better approach is to query for docs with this folderId and update them.
};
