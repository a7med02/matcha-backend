import z from "zod";
import { Pool } from "pg";
import { argon2i } from "argon2";
import { StatusCodes } from "http-status-codes";

import { DatabaseErrorResponse, handleDatabaseError } from "./error-handler";
import { UpsertUser, UpsertUserSchema, User } from "../orm/db-types";
import { db } from "../orm/client";

export interface Response extends DatabaseErrorResponse {
    user?: User;
}

export class users {
    createUser = async (userData: UpsertUser): Promise<Response | null> => {
        if (UpsertUserSchema.safeParse(userData).success === false) {
            throw new Error("Invalid user data format");
        }

        try {
            const response = await db.users.persist.create(
                {
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    username: userData.username,
                },
                ["id", "first_name", "last_name", "username", "created_at", "updated_at"]
            );

            if (response) {
                if (UserSchema.safeParse(response).success) {
                    throw new Error("Database returned data that does not match UserSchema");
                }

                return {
                    status: StatusCodes.CREATED,
                    message: "Successfully created new user.",
                    user: response as User,
                };
            }

            return null;
        } catch (error) {
            return handleDatabaseError(error);
        }
    };

    // getUserById = async (userId: string): Promise<Response | null> => {
    //     if (z.uuid().safeParse(userId).success === false) {
    //         throw new Error("Invalid user ID format");
    //     }

    //     const pool = getPool();

    //     const query = `
    //         SELECT * FROM users
    //         WHERE id = $1;
    //     `;

    //     try {
    //         const response = await pool.query(query, [userId]);

    //         if (response.rowCount && response.rowCount > 0) {
    //             if (UserSchema.safeParse(response.rows[0]).success) {
    //                 throw new Error("Database returned data that does not match UserSchema");
    //             }

    //             return {
    //                 status: StatusCodes.OK,
    //                 message: "Successfully retrieved user.",
    //                 user: response.rows[0] as User,
    //             };
    //         }

    //         return null;
    //     } catch (error) {
    //         return handleDatabaseError(error);
    //     }
    // };
}
