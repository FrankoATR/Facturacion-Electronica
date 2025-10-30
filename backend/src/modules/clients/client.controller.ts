import { Request, Response } from "express";
import { buildSanitizedClientData, clientService } from "./client.service";
import { parsePagination } from "../../common/pagination";
import { UpsertClientDto } from "./client.dto";
import { prisma } from "../../config/prisma";
import { hashPassword } from "../../utils/password";
import { ClientCreateInput } from "./client.repository";

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
    try {
      const result = await prisma.$transaction(async (tx) => {
        const sanitizedData = buildSanitizedClientData(parsed.data as ClientCreateInput);
        const created = await tx.client.create({ data: sanitizedData as any });
        const pwd = Math.random().toString(36).slice(-10);
        let email = (created.email ?? `${created.taxId}@example.com`).toLowerCase();
        
        // Verificar si el email ya existe y generar uno único si es necesario
        let counter = 1;
        let finalEmail = email;
        while (await tx.user.findUnique({ where: { email: finalEmail } })) {
          finalEmail = `${created.taxId}-${counter}@example.com`;
          counter++;
        }
        email = finalEmail;
        
        const user = await tx.user.create({
          data: {
            email,
            name: created.name,
            role: "CUSTOMER",
            clientId: created.id,
            passwordHash: await hashPassword(pwd),
          },
          select: { id: true, email: true },
        });
        return { created, user, pwd };
      });
      res.status(201).json({ data: result.created, customerUser: { id: result.user.id, email: result.user.email, tempPassword: result.pwd } });
    } catch (e: any) {
      if (e.code === "P2002") {
        return res.status(409).json({ message: "Identificador fiscal (taxId) ya existe" });
      }
      throw e;
    }
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
    try {
      const updated = await clientService.update(id, parsed.data);
      res.json({ data: updated });
    } catch (e: any) {
      if (e.code === "P2002") {
        return res.status(409).json({ message: "Identificador fiscal (taxId) ya existe" });
      }
      throw e;
    }
  },
  async toggle(req: Request, res: Response) {
    const { id } = req.params;
    const updated = await clientService.toggle(id);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ data: updated });
  },
};


