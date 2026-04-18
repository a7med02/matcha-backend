// This file serves as a central point for accessing all database repositories.
// Must be edited manually to add new repositories as they are created.

import { BaseRepository } from "./base-repository";
import {
    EmailAddress,
    EmailAddressesTableName,
    EmailAddressUniqueFields,
    SecuritiesTableName,
    Security,
    SecurityUniqueFields,
    User,
    UsersTableName,
    UserUniqueFields,
} from "./db-types";

export const db = {
    users: new BaseRepository<
        User,
        UserUniqueFields,
        { emailAddress: EmailAddress; security: Security }
    >(UsersTableName, {
        emailAddress: {
            table: EmailAddressesTableName,
            localKey: "id",
            foreignKey: "user_id",
        },
        security: {
            table: SecuritiesTableName,
            localKey: "id",
            foreignKey: "user_id",
        },
    }),
    emailAddresses: new BaseRepository<
        EmailAddress,
        EmailAddressUniqueFields,
        { user: User; security: Security }
    >(EmailAddressesTableName, {
        user: {
            table: UsersTableName,
            localKey: "user_id",
            foreignKey: "id",
        },
        security: {
            table: SecuritiesTableName,
            localKey: "user_id",
            foreignKey: "user_id",
        },
    }),
    securities: new BaseRepository<
        Security,
        SecurityUniqueFields,
        { user: User; emailAddress: EmailAddress }
    >(SecuritiesTableName, {
        user: {
            table: UsersTableName,
            localKey: "user_id",
            foreignKey: "id",
        },
        emailAddress: {
            table: EmailAddressesTableName,
            localKey: "user_id",
            foreignKey: "user_id",
        },
    }),
};
