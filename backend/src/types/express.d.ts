import "express";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      role: "ADMIN" | "SELLER";
    }
    interface Request {
      user?: UserPayload;
    }
  }
}

export {};


