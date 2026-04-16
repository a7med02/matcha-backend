export type AuthUser = {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
};

export type PublicUser = {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    createdAt: Date;
};

export type RegisterInput = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
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
