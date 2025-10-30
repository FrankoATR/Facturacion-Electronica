import { Request, Response } from "express";
import { invoiceService } from "./invoice.service";
import { parsePagination } from "../../common/pagination";
import { CreateInvoiceDto } from "./invoice.dto";

export const invoiceController = {
  async list(req: Request, res: Response) {
    const pag = parsePagination(req.query);
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const result = await invoiceService.list({ skip: pag.skip, take: pag.take, status, type });
    res.json(result);
  },
  async create(req: Request, res: Response) {
    const parsed = CreateInvoiceDto.safeParse(req.body);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error);
      return res.status(400).json({ 
        message: "Datos de factura inválidos", 
        errors: parsed.error.errors 
      });
    }
    try {
      const created = await invoiceService.create(req.user?.id, parsed.data);
      res.status(201).json({ data: created });
    } catch (e: any) {
      console.error('Invoice creation error:', e);
      res.status(400).json({ message: e.message ?? "Error al crear factura" });
    }
  },
  async issue(req: Request, res: Response) {
    const { id } = req.params;
    const updated = await invoiceService.issue(id);
    res.json({ data: updated });
  },
  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    try {
      if (!cancellationReason || typeof cancellationReason !== 'string' || cancellationReason.trim().length === 0) {
        return res.status(400).json({ message: "La observación es obligatoria para anular una factura" });
      }
      await invoiceService.cancel(req.user?.id, id, cancellationReason);
      res.status(204).send();
    } catch (e: any) {
      const msg = e.message ?? "Invalid";
      res.status(msg === "Not found" ? 404 : 400).json({ message: msg });
    }
  },
  async get(req: Request, res: Response) {
    const { id } = req.params;
    const inv = await invoiceService.get(id);
    if (!inv) return res.status(404).json({ message: "Not found" });
    res.json({ data: inv });
  },
};


