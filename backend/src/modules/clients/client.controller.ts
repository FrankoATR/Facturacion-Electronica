import { Request, Response } from "express";
import { clientService } from "./client.service";
import { parsePagination } from "../../common/pagination";
import { UpsertClientDto } from "./client.dto";

export const clientController = {
  async list(req: Request, res: Response) {
    const pag = parsePagination(req.query);
    const search = (req.query.search as string | undefined)?.trim();
    const result = await clientService.list(pag, search);
    res.json(result);
  },
  async create(req: Request, res: Response) {
    const parsed = UpsertClientDto.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid" });
    const created = await clientService.create(parsed.data);
    res.status(201).json({ data: created });
  },
  async get(req: Request, res: Response) {
    const { id } = req.params;
    const client = await clientService.findById(id);
    if (!client) return res.status(404).json({ message: "Not found" });
    res.json({ data: client });
  },
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const parsed = UpsertClientDto.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid" });
    const updated = await clientService.update(id, parsed.data);
    res.json({ data: updated });
  },
  async toggle(req: Request, res: Response) {
    const { id } = req.params;
    const updated = await clientService.toggle(id);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ data: updated });
  },
};


