import { clientRepository, ClientCreateInput, ClientUpdateInput } from "./client.repository";
import { PaginationParams } from "../../common/pagination";
import { sanitizeOptionalString, sanitizeString } from "../../common/sanitize";

export const clientService = {
  async list(pag: PaginationParams, search?: string) {
    return clientRepository.list({ skip: pag.skip, take: pag.take, search });
  },
  async create(input: ClientCreateInput) {
    return clientRepository.create({
      name: sanitizeString(input.name),
      taxId: sanitizeString(input.taxId),
      email: sanitizeOptionalString(input.email ?? undefined),
      phone: sanitizeOptionalString(input.phone ?? undefined),
      address: sanitizeOptionalString(input.address ?? undefined),
      status: input.status ?? "ACTIVE",
    } as any);
  },
  async findById(id: string) {
    return clientRepository.findById(id);
  },
  async update(id: string, input: ClientUpdateInput) {
    const data: ClientUpdateInput = { ...input };
    if (data.name) data.name = sanitizeString(data.name);
    if (data.taxId) data.taxId = sanitizeString(data.taxId);
    if (data.email !== undefined) data.email = sanitizeOptionalString(data.email ?? undefined) as any;
    if (data.phone !== undefined) data.phone = sanitizeOptionalString(data.phone ?? undefined) as any;
    if (data.address !== undefined) data.address = sanitizeOptionalString(data.address ?? undefined) as any;
    return clientRepository.update(id, data);
  },
  async toggle(id: string) {
    const client = await clientRepository.findById(id);
    if (!client) return null;
    return clientRepository.update(id, { status: client.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } as any);
  },
};


