import { Router } from "express";
import { authRoutes } from "../../modules/auth/auth.routes";
import { healthRoutes } from "../../modules/health/health.routes";

const v1Router = Router();

v1Router.use("/healthz", healthRoutes);
v1Router.use("/auth", authRoutes);

export { v1Router };
