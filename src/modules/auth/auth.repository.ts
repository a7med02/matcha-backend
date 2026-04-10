import type { AuthUser } from "./auth.types";

type AuthRepository = {
    findByEmail(email: string): Promise<AuthUser | null>;
    findById(id: string): Promise<AuthUser | null>;
    create(user: AuthUser): Promise<AuthUser>;
};

class InMemoryAuthRepository implements AuthRepository {
    private usersById = new Map<string, AuthUser>();

    private usersByEmail = new Map<string, AuthUser>();

    public async findByEmail(email: string): Promise<AuthUser | null> {
        return this.usersByEmail.get(email.toLowerCase()) ?? null;
    }

    public async findById(id: string): Promise<AuthUser | null> {
        return this.usersById.get(id) ?? null;
    }

    public async create(user: AuthUser): Promise<AuthUser> {
        this.usersById.set(user.id, user);
        this.usersByEmail.set(user.email.toLowerCase(), user);
        return user;
    }
}

const authRepository: AuthRepository = new InMemoryAuthRepository();

export { authRepository };
export type { AuthRepository };
