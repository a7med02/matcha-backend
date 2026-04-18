import { BaseMutationOperationsRepository } from "./operations/mutation";
import { BaseRetrievalOperationsRepository } from "./operations/retreivale";
import { BasePersistenceOperationsRepository } from "./operations/persistence";

export type RelationConfig<T = any> = {
    table: string;
    localKey: keyof T;
    foreignKey: string;
};

export type RelationsMap<T = any> = Record<string, RelationConfig<T>>;

// Instance Composition Design pattern for better separation of concerns and testability
export class BaseRepository<T, U extends keyof T, R extends Record<string, any> = {}> {
    public retrieval: BaseRetrievalOperationsRepository<T, U, R>;
    public persist: BasePersistenceOperationsRepository<T>;
    public mutation: BaseMutationOperationsRepository<T>;

    constructor(tableName: string, relations: RelationsMap = {}) {
        this.retrieval = new BaseRetrievalOperationsRepository<T, U, R>(tableName, relations);
        this.persist = new BasePersistenceOperationsRepository<T>(tableName);
        this.mutation = new BaseMutationOperationsRepository<T>(tableName);
    }
}
