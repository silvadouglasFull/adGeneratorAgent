import { AuthenticateUserWithCredentialsUseCase } from "@/auth/application/use-case/AuthenticateUserWithCredentialsUseCase";
import { RegisterUserWithCredentialsUseCase } from "@/auth/application/use-case/RegisterUserWithCredentialsUseCase";
import { DrizzleUserRepository } from "@/auth/infrastructure/persistence/DrizzleUserRepository";
import { PasswordHasher } from "@/auth/infrastructure/security/PasswordHasher";

const userRepository = new DrizzleUserRepository();
const passwordHasher = new PasswordHasher();

export const authContainer = {
    userRepository,
    passwordHasher,
    registerUserWithCredentialsUseCase: new RegisterUserWithCredentialsUseCase(
        userRepository,
        passwordHasher
    ),
    authenticateUserWithCredentialsUseCase: new AuthenticateUserWithCredentialsUseCase(
        userRepository,
        passwordHasher
    ),
};
