import type { FolderSummary, FolderColor } from "@/types";

// Reads existing doc and returns the merged folder
export async function updateFolder(
  uid: string,
  folderId: string,
  patch: { name?: string; color?: FolderColor }
): Promise<FolderSummary> {
  // TODO: Replace with Firestore:
  // - validate ownership
  // - update fields
  // - set updatedAt = serverTimestamp
  // - return the new FolderSummary
  return {
    id: folderId,
    name: patch.name ?? "Untitled",
    color: patch.color ?? "blue",
    setCount: 0,
    updatedAt: Date.now(),
  };
}
