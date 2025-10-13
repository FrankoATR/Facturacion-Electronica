import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { productController } from "../../modules/products/product.controller";

export const productsRouter = Router();

productsRouter.use(authenticate, authorize(["ADMIN", "SELLER"]));

productsRouter.get("/", productController.list);
productsRouter.post("/", authorize(["ADMIN"]), productController.create);
productsRouter.patch("/:id", authorize(["ADMIN"]), productController.update);
productsRouter.post("/:id/adjust", authorize(["ADMIN", "SELLER"]), productController.adjust);


