import { storage } from "../services/storage";
import { USER_ROLES } from "../types/schema";
import type { AuthRequest } from "../middlewares/auth";

export async function resolveCompanyId(
  req: AuthRequest
): Promise<{ companyId: number } | null> {
  const user = req.user;
  if (!user) return null;

  const queryCompanyId = req.query.companyId as string | undefined;
  const companyId = queryCompanyId ? parseInt(queryCompanyId, 10) : null;

  if (companyId && !isNaN(companyId)) {
    if (user.role === USER_ROLES.ADMIN) return { companyId };
    const dbUser = await storage.getUser(user.userId);
    if (dbUser?.companyId === companyId) return { companyId };
    return null;
  }

  const dbUser = await storage.getUser(user.userId);
  if (dbUser?.companyId) return { companyId: dbUser.companyId };
  return null;
}
