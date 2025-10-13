import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { clientController } from "../../modules/clients/client.controller";

export const clientsRouter = Router();

clientsRouter.use(authenticate, authorize(["ADMIN", "SELLER"]));

clientsRouter.get("/", clientController.list);
clientsRouter.post("/", clientController.create);
clientsRouter.get("/:id", clientController.get);
clientsRouter.patch("/:id", clientController.update);
clientsRouter.post("/:id/toggle", clientController.toggle);


