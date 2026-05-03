import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Request } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { logger } from "./config/logger";

import { apiRouter } from "./api";
import { notFoundMiddleware } from "./common/middleware/not-found.middleware";
import { errorHandlerMiddleware } from "./common/middleware/error-handler.middleware";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware";
import { browserCheckMiddleware } from "./common/middleware/browser.middleware";

const app = express();

app.disable("x-powered-by");

app.use(requestIdMiddleware);
app.use(helmet());
app.use(
    cors({
        origin: true,
        credentials: true,
    })
);
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
    })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

morgan.token("requestId", (req) => (req as Request).requestId ?? "n/a");
app.use(
    morgan(":method :url :status :response-time ms rid=:requestId", {
        stream: {
            write: (message) => {
                logger.info(message.trim());
            },
        },
    })
);

app.use(browserCheckMiddleware);
app.use(cookieParser());
app.use(env.API_PREFIX, apiRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export { app };
