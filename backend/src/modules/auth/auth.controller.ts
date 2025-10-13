import { Request, Response } from "express";
import { LoginDto } from "./auth.dto";
import { authService } from "./auth.service";
import { prisma } from "../../config/prisma";

export const authController = {
  async login(req: Request, res: Response) {
    const parsed = LoginDto.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid credentials" });
    const { email, password } = parsed.data;
    const result = await authService.login(email, password);
    if (!result) return res.status(401).json({ message: "Invalid credentials" });
    res.json(result);
  },
  async me(req: Request, res: Response) {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, email: true, name: true, role: true } });
    res.json({ user });
  },
};


