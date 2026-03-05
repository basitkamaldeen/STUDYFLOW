// lib/auth.ts - safe fallback when Clerk is not installed
import { getAuth } from "./clerk-stub";
export function getCurrentUser(req: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
