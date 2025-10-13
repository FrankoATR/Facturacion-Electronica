import { NextFunction, Request, Response } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "test") {
    // Basic UI logs mitigation: limited error leak
    // eslint-disable-next-line no-console
    console.error("Error:", { status, message, stack: err.stack });
  }
  res.status(status).json({ message });
}


