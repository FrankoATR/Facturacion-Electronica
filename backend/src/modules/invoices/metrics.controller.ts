import { Request, Response } from "express";
import { getMonthlyBillingTotal } from "./metrics.service";

export const metricsController = {
  /**
   * GET /api/invoices/metrics?period=month
   * Get billing metrics for the specified period
   */
  async getMetrics(req: Request, res: Response) {
    try {
      const { period } = req.query;
      
      if (period === "month") {
        const total = await getMonthlyBillingTotal();
        return res.json({
          period: "month",
          total,
          currency: "USD",
        });
      }
      
      // Default to monthly if no period specified
      const total = await getMonthlyBillingTotal();
      return res.json({
        period: "month",
        total,
        currency: "USD",
      });
    } catch (error: any) {
      console.error("[METRICS] Error fetching metrics:", error);
      return res.status(500).json({
        error: "Failed to fetch metrics",
        message: error.message,
      });
    }
  },
};

