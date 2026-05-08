// This file is generated from schema.sql.
// Run `npm run generate:orm` after updating the schema.

import { BaseRepository } from "./base-repository";
import {
    User,
    UsersTableName,
    UserUniqueFields,
    EmailAddress,
    EmailAddressesTableName,
    EmailAddressUniqueFields,
    Security,
    SecuritiesTableName,
    SecurityUniqueFields,
    Session,
    SessionsTableName,
    SessionUniqueFields,
    SessionCompositeUniqueFields,
} from "./db-types";

export const db = {
    users: new BaseRepository<
        User,
        UserUniqueFields,
        { emailAddress: EmailAddress; security: Security; session: Session }
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
        session: {
            table: SessionsTableName,
            localKey: "id",
            foreignKey: "user_id",
        },
    }),
    emailAddresses: new BaseRepository<
        EmailAddress,
        EmailAddressUniqueFields,
        { user: User; security: Security; session: Session }
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
        session: {
            table: SessionsTableName,
            localKey: "user_id",
            foreignKey: "user_id",
        },
    }),
    securities: new BaseRepository<
        Security,
        SecurityUniqueFields,
        { user: User; emailAddress: EmailAddress; session: Session }
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
        session: {
            table: SessionsTableName,
            localKey: "user_id",
            foreignKey: "user_id",
        },
    }),
    sessions: new BaseRepository<
        Session,
        SessionUniqueFields,
        { user: User; emailAddress: EmailAddress; security: Security },
        SessionCompositeUniqueFields
    >(SessionsTableName, {
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
        security: {
            table: SecuritiesTableName,
            localKey: "user_id",
            foreignKey: "user_id",
        },
    },
        [["user_id","session_token"]]),
};