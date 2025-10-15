import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const backupRouter = Router();

backupRouter.use(authenticate, authorize(["ADMIN"]));

backupRouter.post("/backup", async (req, res) => {
  const note = req.body?.note as string | undefined;
  const record = await prisma.backupRecord.create({ data: { createdById: req.user?.id, note, location: "local" } });
  res.json({ data: record });
});

backupRouter.post("/restore", async (_req, res) => {
  // In real systems you'd trigger a restore job; here we just acknowledge
  res.json({ message: "Restore initiated" });
});


