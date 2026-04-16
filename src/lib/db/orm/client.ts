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
    users: new BaseRepository<User, UserUniqueFields>(UsersTableName),
    emailAddresses: new BaseRepository<EmailAddress, EmailAddressUniqueFields>(
        EmailAddressesTableName
    ),
    securities: new BaseRepository<Security, SecurityUniqueFields>(SecuritiesTableName),
};
