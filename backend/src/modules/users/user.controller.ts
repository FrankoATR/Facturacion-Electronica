import { Request, Response } from "express";
import { userService } from "./user.service";
import { CreateUserDto, UpdateUserDto } from "./user.dto";
import { hashPassword } from "../../utils/password";

export const userController = {
  async list(_req: Request, res: Response) {
    const users = await userService.list();
    res.json({ data: users });
  },
  async create(req: Request, res: Response) {
    const parsed = CreateUserDto.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid" });
    const { email, name, role, password } = parsed.data;
    const created = await userService.create({ email, name, role, passwordHash: await hashPassword(password) });
    res.status(201).json({ data: created });
  },
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const parsed = UpdateUserDto.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid" });
    const data = { ...parsed.data } as any;
    if (data.password) {
      data.passwordHash = await hashPassword(data.password);
      delete data.password;
    }
    const updated = await userService.update(id, data);
    res.json({ data: updated });
  },
  async resetPassword(req: Request, res: Response) {
    const { id } = req.params;
    const pwd = Math.random().toString(36).slice(-10);
    const passwordHash = await hashPassword(pwd);
    await userService.update(id, { passwordHash } as any);
    res.json({ data: { id, tempPassword: pwd } });
  },
  async remove(req: Request, res: Response) {
    const { id } = req.params;
    await userService.disable(id);
    res.status(204).send();
  },
};


