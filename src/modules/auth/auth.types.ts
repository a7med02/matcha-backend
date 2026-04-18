export type AuthUser = {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
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

export type AuthVerifyEmailResult = {
    message: string;
};

export type ResendVerificationResult = {
    message: string;
};

export type AuthTokenPayload = {
    userId: string;
    email: string;
};
