import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { fromInvoiceToDTE } from "./dte.mapper";
import { signDTE } from "./dte.sign";
import { appendAuditLog } from "../../common/audit";
import { DTEAnnulRequest } from "./dte.types";

export const dteController = {
  /**
   * POST /api/dte/preview/:invoiceId
   * Generate DTE JSON preview without signing
   */
  async preview(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (invoice.status !== "ISSUED") {
        return res.status(400).json({ error: "Invoice must be issued before generating DTE" });
      }

      // Generate DTE payload
      const dtePayload = fromInvoiceToDTE(invoice as any);

      return res.json({
        message: "DTE preview generated",
        dte: dtePayload,
      });
    } catch (error: any) {
      console.error("[DTE] Preview error:", error);
      return res.status(500).json({
        error: "Failed to generate DTE preview",
        message: error.message,
      });
    }
  },

  /**
   * POST /api/dte/sign/:invoiceId
   * Sign DTE and store in invoice
   */
  async sign(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.userId;

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (invoice.status !== "ISSUED") {
        return res.status(400).json({ error: "Invoice must be issued before signing DTE" });
      }

      if (invoice.dteSignature) {
        return res.status(400).json({ error: "Invoice already has a DTE signature" });
      }

      // Generate and sign DTE
      const dtePayload = fromInvoiceToDTE(invoice as any);
      const dteSigned = signDTE(dtePayload);

      // Store DTE in invoice
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          dteJson: dteSigned.payload as any,
          dteSignature: dteSigned.signature,
        },
      });

      // Audit log
      await appendAuditLog({
        actorId: userId,
        action: "DTE_SIGNED",
        entity: "Invoice",
        entityId: invoiceId,
        payload: {
          invoiceNumber: invoice.number,
          hash: dteSigned.hash,
          algorithm: dteSigned.algorithm,
        },
      });

      return res.json({
        message: "DTE signed successfully",
        dte: {
          payload: dteSigned.payload,
          signature: dteSigned.signature,
          hash: dteSigned.hash,
          signedAt: dteSigned.signedAt,
          algorithm: dteSigned.algorithm,
        },
      });
    } catch (error: any) {
      console.error("[DTE] Sign error:", error);
      return res.status(500).json({
        error: "Failed to sign DTE",
        message: error.message,
      });
    }
  },

  /**
   * POST /api/dte/annul/:invoiceId
   * Annul a DTE with reason
   */
  async annul(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.userId;
      const { reason } = req.body as DTEAnnulRequest;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "Annulment reason is required" });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (invoice.status === "ANNULLED") {
        return res.status(400).json({ error: "Invoice is already annulled" });
      }

      if (invoice.status !== "ISSUED") {
        return res.status(400).json({ error: "Only issued invoices can be annulled" });
      }

      // Annul the invoice
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "ANNULLED",
          annulledAt: new Date(),
          annulReason: reason.trim(),
        },
      });

      // Audit log
      await appendAuditLog({
        actorId: userId,
        action: "DTE_ANNULLED",
        entity: "Invoice",
        entityId: invoiceId,
        payload: {
          invoiceNumber: invoice.number,
          reason: reason.trim(),
        },
      });

      return res.json({
        message: "Invoice annulled successfully",
        invoice: {
          id: invoice.id,
          number: invoice.number,
          status: "ANNULLED",
          annulledAt: new Date(),
          annulReason: reason.trim(),
        },
      });
    } catch (error: any) {
      console.error("[DTE] Annul error:", error);
      return res.status(500).json({
        error: "Failed to annul invoice",
        message: error.message,
      });
    }
  },
};

