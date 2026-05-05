import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { validateBody } from "../../common/middleware/validate.middleware";
import { authController } from "./auth.controller";
import {
    changePasswordSchema,
    jwksJSONSchema,
    loginSchema,
    registerSchema,
    resetPasswordRequestSchema,
    resetPasswordVerifySchema,
    resendVerificationSchema,
    verifyEmailSchema,
} from "./auth.validation";

const authRoutes = Router();

authRoutes.get(
    "/.well-known/jwks.json",
    validateBody(jwksJSONSchema),
    asyncHandler(authController.jwksJSON)
);

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
authRoutes.post("/refresh", asyncHandler(authController.refreshSession));
authRoutes.post("/verify", asyncHandler(authController.verifySession));
authRoutes.post(
    "/password-reset",
    validateBody(resetPasswordRequestSchema),
    asyncHandler(authController.requestPasswordReset)
);
authRoutes.post(
    "/password-reset/verify",
    validateBody(resetPasswordVerifySchema),
    asyncHandler(authController.verifyPasswordReset)
);
authRoutes.post(
    "/password-reset/change",
    validateBody(changePasswordSchema),
    asyncHandler(authController.changePassword)
);

export { authRoutes };
