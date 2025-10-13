import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { userController } from "../../modules/users/user.controller";

export const usersRouter = Router();

usersRouter.use(authenticate, authorize(["ADMIN"]));

usersRouter.get("/", userController.list);
usersRouter.post("/", userController.create);
usersRouter.patch("/:id", userController.update);
usersRouter.delete("/:id", userController.remove);


