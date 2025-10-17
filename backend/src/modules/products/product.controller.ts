import { Request, Response } from "express";
import { productService } from "./product.service";
import { parsePagination } from "../../common/pagination";
import { AdjustStockDto, UpsertProductDto } from "./product.dto";

export const productController = {
  async list(req: Request, res: Response) {
    const pag = parsePagination(req.query);
    const search = (req.query.search as string | undefined)?.trim();
    const result = await productService.list(pag, search);
    res.json(result);
  },
  async create(req: Request, res: Response) {
    const parsed = UpsertProductDto.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid" });
    const created = await productService.create(parsed.data);
    res.status(201).json({ data: created });
  },
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const parsed = UpsertProductDto.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid" });
    const updated = await productService.update(id, parsed.data);
    res.json({ data: updated });
  },
  async adjust(req: Request, res: Response) {
    const { id } = req.params;
    const parsed = AdjustStockDto.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid" });
    const updated = await productService.adjustStock(id, parsed.data.quantity, req.user?.id, parsed.data.reason);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ data: updated });
  },
};


