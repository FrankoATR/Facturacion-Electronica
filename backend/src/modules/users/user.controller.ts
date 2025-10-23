import { Request, Response } from "express";
import { userService } from "./user.service";
import { CreateUserDto, UpdateUserDto } from "./user.dto";
import { hashPassword } from "../../utils/password";
import { appendAuditLog } from "../../common/audit";

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
    
    // Registrar en bitácora
    await appendAuditLog({
      actorId: req.user!.id,
      entity: 'User',
      action: 'create',
      entityId: created.id,
      payload: { email, name, role },
    });
    
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
    
    // Registrar en bitácora
    await appendAuditLog({
      actorId: req.user!.id,
      entity: 'User',
      action: 'update',
      entityId: id,
      payload: data,
    });
    
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
  async toggle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const updated = await userService.update(id, { isActive: !user.isActive } as any);
      
      // Registrar en bitácora
      await appendAuditLog({
        actorId: req.user!.id,
        entity: 'User',
        action: 'toggle',
        entityId: id,
        payload: { isActive: !user.isActive },
      });
      
      res.json({ data: updated });
    } catch (error) {
      console.error('Error in user toggle:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};


