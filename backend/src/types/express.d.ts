import "express";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      role: "ADMIN" | "SELLER" | "ACCOUNTANT" | "AUDITOR" | "CUSTOMER";
    }
    interface Request {
      user?: UserPayload;
    }
  }
}

export {};


