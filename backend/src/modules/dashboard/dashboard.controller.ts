import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async metrics(_req: Request, res: Response) {
    const data = await dashboardService.metrics();
    res.json(data);
  },
};


