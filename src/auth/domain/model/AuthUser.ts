import { UserRegistrationOrigin } from "@/auth/domain/model/UserRegistrationOrigin";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    password: string | null;
    registrationOrigin: UserRegistrationOrigin;
}
