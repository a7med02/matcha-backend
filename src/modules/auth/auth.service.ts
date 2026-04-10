import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import { authRepository, type AuthRepository } from "./auth.repository";
import type {
    AuthResult,
    AuthTokenPayload,
    AuthUser,
    LoginInput,
    PublicUser,
    RegisterInput,
} from "./auth.types";

class AuthService {
    constructor(private readonly repository: AuthRepository) {}

    public async register(input: RegisterInput): Promise<AuthResult> {
        const existingUser = await this.repository.findByEmail(input.email);

        if (existingUser) {
            throw new AppError({
                statusCode: 409,
                code: "AUTH_EMAIL_EXISTS",
                message: "Email is already in use",
            });
        }

        const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
        const user: AuthUser = {
            id: randomUUID(),
            email: input.email,
            name: input.name,
            passwordHash,
            createdAt: new Date(),
        };

        await this.repository.create(user);

        return this.toAuthResult(user);
    }

    public async login(input: LoginInput): Promise<AuthResult> {
        const user = await this.repository.findByEmail(input.email);

        if (!user) {
            throw new AppError({
                statusCode: 401,
                code: "AUTH_INVALID_CREDENTIALS",
                message: "Invalid email or password",
            });
        }

        const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

        if (!passwordMatches) {
            throw new AppError({
                statusCode: 401,
                code: "AUTH_INVALID_CREDENTIALS",
                message: "Invalid email or password",
            });
        }

        return this.toAuthResult(user);
    }

    public async getCurrentUser(userId: string): Promise<PublicUser> {
        const user = await this.repository.findById(userId);

        if (!user) {
            throw new AppError({
                statusCode: 404,
                code: "AUTH_USER_NOT_FOUND",
                message: "User not found",
            });
        }

        return this.toPublicUser(user);
    }

    private toAuthResult(user: AuthUser): AuthResult {
        const payload: AuthTokenPayload = {
            userId: user.id,
            email: user.email,
        };

        const signOptions: SignOptions = {
            expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
        };

        const accessToken = jwt.sign(payload, env.JWT_SECRET, signOptions);

        return {
            user: this.toPublicUser(user),
            accessToken,
            tokenType: "Bearer",
            expiresIn: env.JWT_EXPIRES_IN,
        };
    }

    private toPublicUser(user: AuthUser): PublicUser {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
        };
    }
}

const authService = new AuthService(authRepository);

export { authService };
