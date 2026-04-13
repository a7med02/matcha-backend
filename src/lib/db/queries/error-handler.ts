import { StatusCodes /*, getReasonPhrase */ } from "http-status-codes";
import {
    CHECK_VIOLATION,
    FOREIGN_KEY_VIOLATION,
    INVALID_TEXT_REPRESENTATION,
    NOT_NULL_VIOLATION,
    STRING_DATA_RIGHT_TRUNCATION,
    UNIQUE_VIOLATION,
} from "../../constants/pg-error";
import { logger } from "../../../config/logger";
import { DatabaseError } from "pg";

export interface DatabaseErrorResponse {
    status: number;
    message: string;
}

/**
 * Maps Postgres error codes to user-friendly messages and HTTP status codes.
 */
export const handleDatabaseError = (error: any): DatabaseErrorResponse => {
    const response: DatabaseErrorResponse = {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "An unexpected database error occurred.",
    };

    if (!(error instanceof DatabaseError)) {
        return response;
    }

    switch (error.code) {
        case UNIQUE_VIOLATION:
            response.status = StatusCodes.CONFLICT;
            response.message = `This ${error.constraint?.includes("username") ? "username" : "record"} already exists.`;
            break;

        case FOREIGN_KEY_VIOLATION:
            response.status = StatusCodes.BAD_REQUEST;
            response.message = "The referenced record does not exist.";
            break;

        case NOT_NULL_VIOLATION:
            response.status = StatusCodes.BAD_REQUEST;
            response.message = `Missing required field: ${error.column}.`;
            break;

        case STRING_DATA_RIGHT_TRUNCATION:
            response.status = StatusCodes.BAD_REQUEST;
            response.message = "One of the provided fields is too long.";
            break;

        case INVALID_TEXT_REPRESENTATION:
            response.status = StatusCodes.BAD_REQUEST;
            response.message = "Invalid data format (e.g., incorrect ID format).";
            break;

        case CHECK_VIOLATION:
            response.status = StatusCodes.BAD_REQUEST;
            response.message = "The data provided violates security constraints.";
            break;

        default:
            // Handle Connection Timeouts or Pool errors
            if (error.message?.includes("timeout") || error.message?.includes("pool")) {
                response.status = StatusCodes.SERVICE_UNAVAILABLE;
                response.message =
                    "Database is currently busy or unreachable. Please try again later.";
            } else {
                logger.error("Unhandled DB Error:", { error });
            }
            break;
    }

    return response;
};
