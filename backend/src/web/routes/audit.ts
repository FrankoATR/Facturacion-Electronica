import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const auditRouter = Router();

auditRouter.use(authenticate, authorize(["ADMIN", "AUDITOR", "ACCOUNTANT"]));

auditRouter.get("/logs", async (req, res) => {
  const entity = (req.query.entity as string) || undefined;
  const entityId = (req.query.entityId as string) || undefined;

  const where: any = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;

  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
  res.json({ data: logs });
});


