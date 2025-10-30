import { clientRepository, ClientCreateInput, ClientUpdateInput } from "./client.repository";
import { PaginationParams } from "../../common/pagination";
import { sanitizeOptionalString, sanitizeString } from "../../common/sanitize";

const sanitizeOptional = (value?: string | null) => sanitizeOptionalString(value ?? undefined);

export const buildSanitizedClientData = (input: ClientCreateInput): ClientCreateInput => {
  const data: ClientCreateInput = {
    name: sanitizeString(input.name),
    taxId: sanitizeString(input.taxId),
    status: input.status ?? "ACTIVE",
  };

  const optionalFields: Partial<ClientCreateInput> = {
    email: sanitizeOptional(input.email),
    phone: sanitizeOptional(input.phone),
    address: sanitizeOptional(input.address),
    nit: sanitizeOptional(input.nit),
    nrc: sanitizeOptional(input.nrc),
    giro: sanitizeOptional(input.giro),
    actividadEconomica: sanitizeOptional(input.actividadEconomica),
    direccionFiscal: sanitizeOptional(input.direccionFiscal),
  };

  for (const [key, value] of Object.entries(optionalFields)) {
    if (value !== undefined) {
      // @ts-expect-error dynamic assignment on sanitized data
      data[key] = value;
    }
  }

  return data;
};

export const clientService = {
  async list(pag: PaginationParams, search?: string) {
    return clientRepository.list({ skip: pag.skip, take: pag.take, search });
  },
  async create(input: ClientCreateInput) {
    return clientRepository.create(buildSanitizedClientData(input));
  },
  async findById(id: string) {
    return clientRepository.findById(id);
  },
  async update(id: string, input: ClientUpdateInput) {
    const data: ClientUpdateInput = { ...input };
    if (data.name) data.name = sanitizeString(data.name);
    if (data.taxId) data.taxId = sanitizeString(data.taxId);
    if (data.email !== undefined) data.email = sanitizeOptional(data.email) as any;
    if (data.phone !== undefined) data.phone = sanitizeOptional(data.phone) as any;
    if (data.address !== undefined) data.address = sanitizeOptional(data.address) as any;
    if (data.nit !== undefined) data.nit = sanitizeOptional(data.nit) as any;
    if (data.nrc !== undefined) data.nrc = sanitizeOptional(data.nrc) as any;
    if (data.giro !== undefined) data.giro = sanitizeOptional(data.giro) as any;
    if (data.actividadEconomica !== undefined) data.actividadEconomica = sanitizeOptional(data.actividadEconomica) as any;
    if (data.direccionFiscal !== undefined) data.direccionFiscal = sanitizeOptional(data.direccionFiscal) as any;
    return clientRepository.update(id, data);
  },
  async toggle(id: string) {
    const client = await clientRepository.findById(id);
    if (!client) return null;
    return clientRepository.update(id, { status: client.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } as any);
  },
};


