import { AuthUser } from "@/auth/domain/model/AuthUser";

export interface CreateCredentialsUserInput {
    email: string;
    name: string;
    passwordHash: string;
}

export interface UpsertGoogleUserInput {
    email: string;
    name: string;
}

export interface IUserRepository {
    findByEmail(email: string): Promise<AuthUser | null>;
    createCredentialsUser(input: CreateCredentialsUserInput): Promise<AuthUser>;
    upsertGoogleUser(input: UpsertGoogleUserInput): Promise<AuthUser>;
}
