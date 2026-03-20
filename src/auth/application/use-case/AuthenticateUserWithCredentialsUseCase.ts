import { InvalidCredentialsException } from "@/auth/domain/exception/InvalidCredentialsException";
import { AuthUser } from "@/auth/domain/model/AuthUser";
import { IUserRepository } from "@/auth/domain/service/IUserRepository";
import { PasswordHasher } from "@/auth/infrastructure/security/PasswordHasher";

export class AuthenticateUserWithCredentialsUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordHasher: PasswordHasher
    ) { }

    async execute(email: string, password: string): Promise<AuthUser> {
        const user = await this.userRepository.findByEmail(email);

        if (!user || user.registrationOrigin !== "default" || !user.password) {
            throw new InvalidCredentialsException();
        }

        const isValidPassword = await this.passwordHasher.verify(password, user.password);

        if (!isValidPassword) {
            throw new InvalidCredentialsException();
        }

        return user;
    }
}
