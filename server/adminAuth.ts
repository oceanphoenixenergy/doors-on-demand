import bcrypt from "bcryptjs";
import { storage } from "./storage";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "doors2024";

export async function ensureAdminUser() {
  const existing = await storage.getAdminUser(DEFAULT_USERNAME);
  if (!existing) {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await storage.createAdminUser(DEFAULT_USERNAME, hash);
    console.log(`Default admin user created (username: ${DEFAULT_USERNAME})`);
  }
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const user = await storage.getAdminUser(username);
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function changeAdminPassword(username: string, newPassword: string): Promise<boolean> {
  const user = await storage.getAdminUser(username);
  if (!user) return false;
  const hash = await bcrypt.hash(newPassword, 10);
  const { db } = await import("./storage");
  const { adminUsers } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  await db.update(adminUsers).set({ passwordHash: hash }).where(eq(adminUsers.username, username));
  return true;
}
