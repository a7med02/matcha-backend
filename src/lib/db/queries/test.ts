// TODO: Remove this test file

import { db } from "../orm/client";
import { EmailAddress, Security, User } from "../orm/db-types";

const runCreate = async (): Promise<
    | {
          user: User;
          emailAddress: EmailAddress;
          security: Security;
      }
    | undefined
> => {
    console.info("Running create test...");

    try {
        const user = await db.users.persist.create({
            first_name: "John",
            last_name: "Doe",
            username: "johndoe",
        });

        if (!user) {
            console.error("Failed to create user");
            return;
        }

        console.log("Created user:", user);

        const emailAddress = await db.emailAddresses.persist.create({
            user_id: user.id,
            email: "john.doe@example.com",
            verified: false,
            verification_code: "123456",
        });

        if (!emailAddress) {
            console.error("Failed to create email address");
            return;
        }

        console.log("Created email address:", emailAddress);

        const security = await db.securities.persist.create({
            user_id: user.id,
            password_hash: "hashed_password",
        });

        if (!security) {
            console.error("Failed to create security record");
            return;
        }

        console.log("Created security record:", security);

        return { user, emailAddress, security };
    } catch (error) {
        console.error("Error running test:", error);
        return;
    }
};

const runFailedCreateUser = async () => {
    console.info("Running failed create user test...");

    try {
        const user = await db.users.persist.create({
            first_name: "Jane",
            last_name: "Doe",
            username: "johndoe", // Duplicate username to trigger unique constraint violation
        });

        console.log("Created user:", user);
    } catch (error) {
        console.error("Expected error for duplicate username:", error);
        return;
    }
};

const runFailedCreateEmail = async (user: User) => {
    console.info("Running failed create email test...");

    try {
        const emailAddress = await db.emailAddresses.persist.create({
            user_id: user.id, // Invalid user_id to trigger foreign key constraint violation
            email: "john.doe@example.com",
            verified: false,
            verification_code: "123456",
        });

        console.log("Created email address:", emailAddress);
    } catch (error) {
        console.error("Expected error for invalid user_id:", error);
        return;
    }
};

const runDelete = async () => {
    console.info("Running delete test...");

    try {
        const deleteUser = await db.users.mutation.delete({
            where: {
                username: "johndoe",
            },
        });

        console.log("Deleted user:", deleteUser);
    } catch (error) {
        console.error("Error running test:", error);
        return;
    }
};

const runAllTests = async () => {
    const created = await runCreate();

    if (created) {
        await runFailedCreateUser();
        await runFailedCreateEmail(created.user);
        await runDelete();
    }
};

runAllTests();
