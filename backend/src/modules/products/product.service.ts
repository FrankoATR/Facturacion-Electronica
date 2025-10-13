import { productRepository, ProductCreateInput, ProductUpdateInput } from "./product.repository";
import { PaginationParams } from "../../common/pagination";

export const productService = {
  async list(pag: PaginationParams, search?: string) {
    return productRepository.list({ skip: pag.skip, take: pag.take, search });
  },
  async create(input: ProductCreateInput) {
    return productRepository.create(input);
  },
  async update(id: string, input: ProductUpdateInput) {
    return productRepository.update(id, input);
  },
  async adjustStock(id: string, delta: number, userId?: string, reason?: string) {
    return productRepository.adjustStock({ id, delta, userId, reason });
  },
  async findById(id: string) {
    return productRepository.findById(id);
  },
};


