import { WhereClause } from "./types";

import { InterfaceRepository } from "../interface-repository";

export class BaseMutationOperationsRepository<T> extends InterfaceRepository<T> {
    async update(
        data: Partial<T>,
        options: { where: WhereClause<T>; select?: (keyof T)[] }
    ): Promise<Partial<T>[]> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // 1. SET placeholders ($1, $2, etc.)
        for (const [key, value] of Object.entries(data)) {
            setClauses.push(`${key} = $${paramIndex++}`);
            values.push(value);
        }

        // 2. WHERE placeholders (Starts where SET left off!)
        const { clauses: whereClause, values: whereValues } = this.processFilters(
            options.where,
            paramIndex // Pass current count!
        );
        values.push(...whereValues);

        const returning = options.select ? options.select.join(", ") : "*";

        // Build the final string
        const sql = `UPDATE ${this.tableName} SET ${setClauses.join(", ")} WHERE ${whereClause} RETURNING ${returning};`;

        try {
            const result = await this.query(sql, values);
            return (result.rows as Partial<T>[]) || [];
        } catch (error) {
            throw error;
        }
    }

    async delete(where: WhereClause<T>): Promise<T[]> {
        const { clauses, values } = this.processFilters(where);

        const sql = `DELETE FROM ${this.tableName} WHERE ${clauses} RETURNING *;`;

        try {
            const result = await this.query(sql, values);
            return (result.rows as T[]) || [];
        } catch (error) {
            throw error;
        }
    }
}
