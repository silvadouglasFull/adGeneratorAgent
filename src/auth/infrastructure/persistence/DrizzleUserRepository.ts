import { AuthUser } from "@/auth/domain/model/AuthUser";
import {
    CreateCredentialsUserInput,
    IUserRepository,
    UpsertGoogleUserInput,
} from "@/auth/domain/service/IUserRepository";
import { db as defaultDb } from "@/tokenConsumption/infrastructure/db/client";
import { eq } from "drizzle-orm";
import { usersTable } from "@/tokenConsumption/infrastructure/db/schema";

type DatabaseLike = typeof defaultDb;

export class DrizzleUserRepository implements IUserRepository {
    constructor(private readonly db: DatabaseLike = defaultDb) { }

    async findByEmail(email: string): Promise<AuthUser | null> {
        const rows = await this.db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1);

        const row = rows[0];

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            email: row.email,
            name: row.name,
            password: row.password,
            registrationOrigin: row.registrationOrigin,
        };
    }

    async createCredentialsUser(input: CreateCredentialsUserInput): Promise<AuthUser> {
        const [row] = await this.db
            .insert(usersTable)
            .values({
                email: input.email,
                password: input.passwordHash,
                name: input.name,
                registrationOrigin: "default",
            })
            .returning();

        return {
            id: row.id,
            email: row.email,
            name: row.name,
            password: row.password,
            registrationOrigin: row.registrationOrigin,
        };
    }

    async upsertGoogleUser(input: UpsertGoogleUserInput): Promise<AuthUser> {
        const existingUser = await this.findByEmail(input.email);

        if (existingUser) {
            return existingUser;
        }

        const [row] = await this.db
            .insert(usersTable)
            .values({
                email: input.email,
                password: null,
                name: input.name,
                registrationOrigin: "google",
            })
            .returning();

        return {
            id: row.id,
            email: row.email,
            name: row.name,
            password: row.password,
            registrationOrigin: row.registrationOrigin,
        };
    }
}
