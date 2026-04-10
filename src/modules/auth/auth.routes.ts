import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { authMiddleware } from "../../common/middleware/auth.middleware";
import { validateBody } from "../../common/middleware/validate.middleware";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), asyncHandler(authController.register));
authRoutes.post("/login", validateBody(loginSchema), asyncHandler(authController.login));
authRoutes.get("/me", authMiddleware, asyncHandler(authController.me));

export { authRoutes };
