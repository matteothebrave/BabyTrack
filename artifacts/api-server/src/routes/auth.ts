import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "../lib/settings-helper";

const router = Router();

async function ensureUsersExist() {
  const existing = await db.select().from(usersTable);
  if (existing.length === 0) {
    const settings = await getSettings();
    const dadName = settings?.parentName || "Dad";
    const momName = settings?.momName || "Tamara";
    await db.insert(usersTable).values([
      { role: "dad", name: dadName },
      { role: "mom", name: momName },
    ]);
  }
}

router.get("/status", async (req, res) => {
  await ensureUsersExist();
  const users = await db.select({
    role: usersTable.role,
    name: usersTable.name,
    hasPin: usersTable.pinHash,
  }).from(usersTable);

  res.json(
    users.map((u) => ({ role: u.role, name: u.name, hasPin: u.hasPin !== null }))
  );
});

router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json({
    id: req.session.userId,
    role: req.session.userRole,
    name: req.session.userName,
  });
});

router.post("/login", async (req, res) => {
  const { role, pin } = req.body as { role: string; pin: string };

  if (!role || !pin || pin.length < 4) {
    return res.status(400).json({ message: "Invalid request" });
  }

  await ensureUsersExist();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, role));

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.pinHash) {
    const hash = await bcrypt.hash(pin, 10);
    await db
      .update(usersTable)
      .set({ pinHash: hash })
      .where(eq(usersTable.id, user.id));

    req.session.userId = user.id;
    req.session.userRole = user.role as "dad" | "mom";
    req.session.userName = user.name;
    return res.json({ id: user.id, role: user.role, name: user.name });
  }

  const match = await bcrypt.compare(pin, user.pinHash);
  if (!match) {
    return res.status(401).json({ message: "Incorrect PIN" });
  }

  req.session.userId = user.id;
  req.session.userRole = user.role as "dad" | "mom";
  req.session.userName = user.name;
  res.json({ id: user.id, role: user.role, name: user.name });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.post("/change-pin", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const { currentPin, newPin } = req.body as { currentPin: string; newPin: string };

  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ message: "PIN must be at least 4 digits" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (user.pinHash) {
    const match = await bcrypt.compare(currentPin, user.pinHash);
    if (!match) {
      return res.status(401).json({ message: "Current PIN is incorrect" });
    }
  }

  const hash = await bcrypt.hash(newPin, 10);
  await db
    .update(usersTable)
    .set({ pinHash: hash })
    .where(eq(usersTable.id, user.id));

  res.json({ ok: true });
});

export default router;
