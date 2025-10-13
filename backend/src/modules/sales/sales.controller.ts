import { Request, Response } from "express";
import { salesService } from "./sales.service";
import { parsePagination } from "../../common/pagination";

export const salesController = {
  async list(req: Request, res: Response) {
    const pag = parsePagination(req.query);
    const { from, to, clientId, type } = req.query as any;
    const result = await salesService.list(pag, { from, to, clientId, type });
    res.json(result);
  },
};


