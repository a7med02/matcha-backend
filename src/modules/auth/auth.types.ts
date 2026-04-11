export type AuthUser = {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
};

export type PublicUser = {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    username: string;
    createdAt: Date;
};

export type RegisterInput = {
    email: string;
    firstname: string;
    lastname: string;
    username: string;
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
