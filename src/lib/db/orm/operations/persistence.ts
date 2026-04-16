import { InterfaceRepository } from "../interface-repository";

export class BasePersistenceOperationsRepository<T> extends InterfaceRepository<T> {
    async create(data: Partial<T>, select?: (keyof T)[]): Promise<Partial<T>> {
        const keys = Object.keys(data);
        const values = Object.values(data);

        const columns = keys.join(", ");
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

        const returning = select ? select.join(", ") : "*";

        const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING ${returning};`;

        try {
            const result = await this.query(sql, values);
            return (result.rows[0] as unknown as Partial<T>) || null;
        } catch (error) {
            throw error;
        }
    }

    async createMany(data: Partial<T>[], select?: (keyof T)[]): Promise<T[]> {
        if (data.length === 0) return [];

        const keys = Object.keys(data[0]);
        const columns = keys.join(", ");
        const values: any[] = [];

        // Build: ($1, $2), ($3, $4)...
        const valueSets = data
            .map((obj, _) => {
                const rowPlaceholders = keys.map((_, colIndex) => {
                    values.push((obj as any)[keys[colIndex]]);
                    return `$${values.length}`;
                });
                return `(${rowPlaceholders.join(", ")})`;
            })
            .join(", ");

        const returning = select ? select.join(", ") : "*";

        const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES ${valueSets} RETURNING ${returning};`;

        try {
            const result = await this.query(sql, values);
            return (result.rows as T[]) || null;
        } catch (error) {
            throw error;
        }
    }
}
