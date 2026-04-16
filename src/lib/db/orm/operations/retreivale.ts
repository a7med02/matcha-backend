import { UniqueWhere, WhereClause } from "./types";

import { InterfaceRepository } from "../interface-repository";

interface FindOptions<T> {
    select?: (keyof T)[];
    where?: WhereClause<T>;
    orderBy?: { [K in keyof T]?: "ASC" | "DESC" };
    limit?: number;
    offset?: number;
}

export class BaseRetrievalOperationsRepository<
    T,
    U extends keyof T,
> extends InterfaceRepository<T> {
    async findUnique(options: {
        select?: (keyof T)[];
        where: UniqueWhere<T, U>; // Enforces only UNIQUE fields
    }) {
        // 1. Cast for safe access and extract the key/value
        const where = options.where as Record<string, any>;
        const keys = Object.keys(options.where);

        if (keys.length === 0) {
            throw new Error("findUnique requires exactly one unique key-value pair.");
        }

        const columns = options.select ? options.select.join(", ") : "*";

        const clause = keys[0];
        const value = where[clause];

        // 2. Build the parameterized SQL query
        //! we use parameterized queries to prevent SQL injection attacks
        const sql = `SELECT ${columns} FROM ${this.tableName} WHERE ${clause} = $1 LIMIT 2;`;

        try {
            // 3. Execute the query and return the result
            const result = await this.query(sql, [value]);

            if (result.rowCount && result.rowCount === 0) {
                return null; // No record found
            }

            if (result.rowCount && result.rowCount > 1) {
                throw new Error(
                    `Integrity Error: Unique constraint violation in findUnique. Found ${result.rowCount} records.`
                );
            }

            return (result.rows[0] as T) || null;
        } catch (error) {
            throw error;
        }
    }

    async findFirst(option: Omit<FindOptions<T>, "limit">) {
        const { select, where, orderBy, offset } = option;
        const values: any[] = [];

        const columns = select ? select.join(", ") : "*";
        let sql = `SELECT ${columns} FROM ${this.tableName}`;

        if (where) {
            const { clauses, values: whereValues } = this.processFilters(where);
            sql += ` WHERE ${clauses}`;
            values.push(...whereValues);
        }

        if (orderBy) {
            const orderClauses = Object.entries(orderBy).map(
                ([column, direction]) => `${column} ${direction}`
            );
            sql += ` ORDER BY ${orderClauses.join(", ")}`;
        }

        if (offset !== undefined) {
            sql += ` OFFSET ${offset}`;
        }

        sql += ` LIMIT 1`; // Ensure only one record is returned

        try {
            const result = await this.query(sql, values);
            return (result.rows[0] as T) || null;
        } catch (error) {
            throw error;
        }
    }

    async findMany(options: FindOptions<T> = {}) {
        const { select, where, orderBy, limit, offset } = options;
        const values: any[] = [];

        // 1. SELECT Column logic
        const columns = select ? select.join(", ") : "*";
        let sql = `SELECT ${columns} FROM ${this.tableName}`;

        // 2. Advanced WHERE logic
        if (where) {
            const { clauses, values: whereValues } = this.processFilters(where);
            sql += ` WHERE ${clauses}`;
            values.push(...whereValues);
        }

        // 3. ORDER BY logic
        if (orderBy) {
            const orderClauses = Object.entries(orderBy).map(
                ([column, direction]) => `${column} ${direction}`
            );
            sql += ` ORDER BY ${orderClauses.join(", ")}`;
        }

        // 4. LIMIT and OFFSET logic
        if (limit !== undefined) {
            sql += ` LIMIT ${limit}`;
        }
        if (offset !== undefined) {
            sql += ` OFFSET ${offset}`;
        }

        try {
            const result = await this.query(sql, values);
            return (result.rows as T[]) || null;
        } catch (error) {
            throw error;
        }
    }

    async count(where?: WhereClause<T>) {
        const { clauses, values } = this.processFilters(where || {});

        let sql = `SELECT COUNT(*) FROM ${this.tableName}`;

        sql += clauses ? ` WHERE ${clauses}` : "";

        try {
            const result = await this.query(sql, values);

            const row = result.rows[0] as unknown as { count: string | number } | undefined;

            return Number(row?.count ?? 0);
        } catch (error) {
            throw error;
        }
    }

    // async aggregate(criteria: Partial<T>) {}

    // async groupBy(criteria: Partial<T>) {}
}
