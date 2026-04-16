import { BaseMutationOperationsRepository } from "./operations/mutation";
import { BaseRetrievalOperationsRepository } from "./operations/retreivale";
import { BasePersistenceOperationsRepository } from "./operations/persistence";

// Instance Composition Design pattern for better separation of concerns and testability
export class BaseRepository<T, U extends keyof T> {
    public retrieval: BaseRetrievalOperationsRepository<T, U>;
    public persist: BasePersistenceOperationsRepository<T>;
    public mutation: BaseMutationOperationsRepository<T>;

    constructor(tableName: string) {
        this.retrieval = new BaseRetrievalOperationsRepository<T, U>(tableName);
        this.persist = new BasePersistenceOperationsRepository<T>(tableName);
        this.mutation = new BaseMutationOperationsRepository<T>(tableName);
    }
}
