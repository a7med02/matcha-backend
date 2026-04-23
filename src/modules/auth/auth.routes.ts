import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { validateBody } from "../../common/middleware/validate.middleware";
import { authController } from "./auth.controller";
import {
    loginSchema,
    registerSchema,
    resendVerificationSchema,
    verifyEmailSchema,
} from "./auth.validation";

const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), asyncHandler(authController.register));
authRoutes.post(
    "/verify-email",
    validateBody(verifyEmailSchema),
    asyncHandler(authController.verifyEmail)
);
authRoutes.post(
    "/resend-verification-code",
    validateBody(resendVerificationSchema),
    asyncHandler(authController.resendVerification)
);
authRoutes.post("/login", validateBody(loginSchema), asyncHandler(authController.login));

// authRoutes.get("/me", authMiddleware, asyncHandler(authController.me));

export { authRoutes };
