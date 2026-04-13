import { StatusCodes } from "http-status-codes";
import { getPool } from "../db";
import { UpsertUser, UpsertUserSchema, User, Users, UserSchema } from "../db-types";
import { DatabaseErrorResponse, handleDatabaseError } from "./error-handler";

export interface CreateUserResponse extends DatabaseErrorResponse {
    user?: User;
}

export const createUser = async (userData: UpsertUser): Promise<CreateUserResponse> => {
    if (UpsertUserSchema.safeParse(userData).success === false) {
        return {
            status: StatusCodes.BAD_REQUEST,
            message: "Invalid input data",
        }
    }

    const pool = getPool();

    const query = `
        INSERT INTO users (${Users.firstName}, ${Users.lastName}, ${Users.username})
        VALUES ($1. $2, $3)
        RETURNING *;
    `;

    const values: string[] = [userData.first_name, userData.last_name, userData.username];

    try {
        const response = await pool.query(query, values);

        if (response.rowCount && response.rowCount > 0) {
            if (UserSchema.safeParse(response.rows[0]).success) {
                return {
                    status: StatusCodes.INTERNAL_SERVER_ERROR,
                    message: "Database returned data that does not match UserSchema",
                };
            }

            return {
                status: StatusCodes.CREATED,
                message: "Successfully created new user.",
                user: response.rows[0] as User,
            };
        }

        return {
            status: StatusCodes.BAD_REQUEST,
            message: "User failed to be created.",
        };
    } catch (error) {
        return handleDatabaseError(error);
    }
};
