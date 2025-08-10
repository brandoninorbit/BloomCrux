
import { db } from "@/lib/firebase";
import type { FolderSummary, FolderColor } from "@/types";
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from "firebase/firestore";

// Reads existing doc and returns the merged folder
export async function updateFolder(
  uid: string,
  folderId: string,
  patch: { name?: string; color?: FolderColor }
): Promise<FolderSummary> {
  const folderRef = doc(db, 'users', uid, 'folders', folderId);
  
  // You would typically have security rules to validate ownership.
  // For the client, we'll assume the operation is allowed if it doesn't throw.
  
  const dataToUpdate: Record<string, any> = { ...patch, updatedAt: serverTimestamp() };
  await updateDoc(folderRef, dataToUpdate);

  const updatedDoc = await getDoc(folderRef);
  const updatedData = updatedDoc.data();

  return {
    id: folderId,
    name: updatedData?.name ?? "Untitled",
    color: updatedData?.color ?? "blue",
    setCount: updatedData?.setCount ?? 0,
    updatedAt: updatedData?.updatedAt?.toMillis() ?? Date.now(),
  };
}

export async function createFolder(
  uid: string,
  data: { name: string; color: FolderColor }
): Promise<FolderSummary> {
  const foldersCollectionRef = collection(db, 'users', uid, 'folders');
  
  const newDocRef = await addDoc(foldersCollectionRef, {
    ownerId: uid,
    name: data.name,
    color: data.color,
    setCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return {
    id: newDocRef.id,
    name: data.name,
    color: data.color,
    setCount: 0,
    updatedAt: Date.now(),
  };
}
