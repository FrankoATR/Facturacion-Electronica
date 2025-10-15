import crypto from "crypto";
import { prisma } from "../config/prisma";

type AuditParams = {
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  payload?: unknown;
};

export async function appendAuditLog(params: AuditParams) {
  const last = await prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" } });
  const prevHash = last?.hash ?? "";
  const digest = crypto
    .createHash("sha256")
    .update(
      `${prevHash}|${params.action}|${params.entity}|${params.entityId}|${JSON.stringify(
        params.payload ?? {}
      )}|${Date.now()}`
    )
    .digest("hex");

  return prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      payload: params.payload as any,
      prevHash,
      hash: digest,
    },
  });
}


