import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { fromInvoiceToDTE } from "./dte.mapper";
import { signDTEWithAES, generateControlCode, generateElectronicSeal, verifyDTESignature } from "./dte-crypto";
import { appendAuditLog } from "../../common/audit";
import { DTEAnnulRequest } from "./dte.types";
import { emailService } from "../email/email.service";
import { buildInvoiceDto, buildDTEDocument } from "./dte.service";
import { generateInvoicePdfBuffer } from "./pdf-renderer";

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

      // Generate DTE payload (can preview in any status)
      // For preview, use issuedAt if exists, otherwise use current date
      const invoiceForPreview = {
        ...invoice,
        issuedAt: invoice.issuedAt || new Date(),
      };
      const dtePayload = fromInvoiceToDTE(invoiceForPreview as any);

      // Add control code
      const controlCode = generateControlCode(
        invoice.number,
        Number(invoice.total),
        invoice.issuedAt || new Date()
      );

      return res.json({
        message: "DTE preview generated",
        dte: {
          ...dtePayload,
          codigoGeneracion: controlCode,
        },
        status: invoice.status,
        signed: !!invoice.dteSignature,
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
   * Sign DTE with AES-256-GCM and store in invoice
   */
  async sign(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id;

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

      if (invoice.dteSignature) {
        return res.status(400).json({
          error: "Invoice already has a DTE signature",
          signedAt: invoice.updatedAt
        });
      }

      // First update the invoice to set issuedAt and status
      const issuedAt = new Date();
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "ISSUED",
          issuedAt,
        },
      });

      // Now fetch the complete invoice with issuedAt set
      const updatedInvoice = await prisma.invoice.findUnique({
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

      if (!updatedInvoice) {
        return res.status(404).json({ error: "Invoice not found after update" });
      }

      // Generate DTE payload with issuedAt set
      const dtePayload = fromInvoiceToDTE(updatedInvoice as any);

      // Add control code and electronic seal
      const controlCode = generateControlCode(
        updatedInvoice.number,
        Number(updatedInvoice.total),
        updatedInvoice.issuedAt || new Date()
      );

      const electronicSeal = generateElectronicSeal();

      const completeDTE = {
        ...dtePayload,
        codigoGeneracion: controlCode,
        selloRecepcion: electronicSeal,
      };

      // Sign DTE with AES-256-GCM
      const signedDTE = signDTEWithAES(completeDTE);

      // Store DTE signature in invoice
      const finalInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          dteJson: signedDTE.dteJson as any,
          dteSignature: JSON.stringify({
            signature: signedDTE.signature,
            method: signedDTE.signatureMethod,
            signedAt: signedDTE.signedAt,
            hash: signedDTE.hash,
            controlCode,
            electronicSeal,
          }),
        },
      });

      // Audit log
      await appendAuditLog({
        actorId: userId,
        action: "DTE_SIGNED",
        entity: "Invoice",
        entityId: invoiceId,
        payload: {
          invoiceNumber: finalInvoice.number,
          hash: signedDTE.hash,
          method: signedDTE.signatureMethod,
          controlCode,
        },
      });

      // Intentar enviar la factura por correo al cliente
      if (updatedInvoice.client?.email) {
        try {
          const [dto, dteDoc] = await Promise.all([
            buildInvoiceDto(invoiceId),
            buildDTEDocument(invoiceId),
          ]);

          if (dto && dteDoc) {
            const pdfBuffer = await generateInvoicePdfBuffer(dto, dteDoc);
            const emailResult = await emailService.sendInvoiceEmail(
              updatedInvoice.client.email,
              updatedInvoice.number,
              updatedInvoice.client.name,
              Number(updatedInvoice.total),
              pdfBuffer
            );

            if (!emailResult.success) {
              console.error(`[DTE] Error al enviar correo de factura ${updatedInvoice.number}:`, emailResult.error);
            } else {
              console.log(`[DTE] Correo de factura ${updatedInvoice.number} enviado a ${updatedInvoice.client.email}`);
            }
          } else {
            console.warn(`[DTE] No se pudo generar DTO o DTE para enviar factura ${updatedInvoice.number} por correo`);
          }
        } catch (emailError) {
          console.error("[DTE] Error al generar o enviar correo de factura:", emailError);
        }
      } else {
        console.log(`[DTE] Factura ${updatedInvoice.number} firmada sin correo de cliente disponible, no se envía email`);
      }

      return res.json({
        message: "DTE signed successfully",
        invoice: {
          id: finalInvoice.id,
          number: finalInvoice.number,
          status: finalInvoice.status,
        },
        dte: {
          payload: signedDTE.dteJson,
          signature: {
            value: signedDTE.signature,
            method: signedDTE.signatureMethod,
            signedAt: signedDTE.signedAt,
            hash: signedDTE.hash,
            controlCode,
            electronicSeal,
          },
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
   * Annul a DTE with reason (for product returns, errors, etc.)
   */
  async annul(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body as DTEAnnulRequest;

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: "Annulment reason is required" });
      }

      if (reason.trim().length < 10) {
        return res.status(400).json({ error: "Annulment reason must be at least 10 characters" });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (invoice.status === "ANNULLED") {
        return res.status(400).json({ 
          error: "Invoice is already annulled",
          annulledAt: invoice.annulledAt,
          annulReason: invoice.annulReason,
        });
      }

      if (invoice.status !== "ISSUED") {
        return res.status(400).json({ 
          error: "Only issued invoices can be annulled",
          currentStatus: invoice.status 
        });
      }

      if (!invoice.dteSignature) {
        return res.status(400).json({ error: "Invoice does not have a DTE signature" });
      }

      // Annul the invoice
      const annulledInvoice = await prisma.invoice.update({
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
          previousStatus: invoice.status,
        },
      });

      return res.json({
        message: "Invoice annulled successfully",
        invoice: {
          id: annulledInvoice.id,
          number: annulledInvoice.number,
          status: annulledInvoice.status,
          annulledAt: annulledInvoice.annulledAt,
          annulReason: annulledInvoice.annulReason,
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

  /**
   * GET /api/dte/verify/:invoiceId
   * Verify DTE signature integrity
   */
  async verify(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (!invoice.dteSignature || !invoice.dteJson) {
        return res.status(400).json({ error: "Invoice does not have a DTE signature" });
      }

      // Parse signature data
      const signatureData = JSON.parse(invoice.dteSignature as string);
      
      // Verify signature
      const isValid = verifyDTESignature(
        signatureData.signature,
        invoice.dteJson,
        signatureData.hash
      );

      return res.json({
        valid: isValid,
        invoice: {
          number: invoice.number,
          status: invoice.status,
        },
        signature: {
          method: signatureData.method,
          signedAt: signatureData.signedAt,
          hash: signatureData.hash,
          controlCode: signatureData.controlCode,
        },
      });
    } catch (error: any) {
      console.error("[DTE] Verify error:", error);
      return res.status(500).json({
        error: "Failed to verify DTE",
        message: error.message,
      });
    }
  },
};
