export type AuthUser = {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
};

export type PublicUser = {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
};

export type RegisterInput = {
    email: string;
    name: string;
    password: string;
};

export type LoginInput = {
    email: string;
    password: string;
};

export type AuthResult = {
    user: PublicUser;
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: string;
};

export type AuthTokenPayload = {
    userId: string;
    email: string;
};
