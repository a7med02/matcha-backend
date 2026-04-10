import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error";

const validateBody = <TBody>(schema: ZodType<TBody>): RequestHandler => {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req.body);

        if (!parsed.success) {
            next(
                new AppError({
                    statusCode: 400,
                    code: "VALIDATION_ERROR",
                    message: "Request body validation failed",
                    details: parsed.error.flatten(),
                })
            );
            return;
        }

        req.body = parsed.data;
        next();
    };
};

export { validateBody };
