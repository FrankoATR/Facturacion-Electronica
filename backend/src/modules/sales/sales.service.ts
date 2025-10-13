import { salesRepository } from "./sales.repository";
import { PaginationParams } from "../../common/pagination";
import { mapInvoiceNumbers } from "../../common/serialization";

export const salesService = {
  async list(pag: PaginationParams, filters: { from?: string; to?: string; clientId?: string; type?: string }) {
    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;
    const result = await salesRepository.list({ skip: pag.skip, take: pag.take, from, to, clientId: filters.clientId, type: filters.type });
    return { data: result.data.map(mapInvoiceNumbers), total: result.total };
  },
};


