import { UserAlreadyExistsException } from "@/auth/domain/exception/UserAlreadyExistsException";
import { AuthUser } from "@/auth/domain/model/AuthUser";
import { IUserRepository } from "@/auth/domain/service/IUserRepository";
import { PasswordHasher } from "@/auth/infrastructure/security/PasswordHasher";

interface RegisterUserWithCredentialsInput {
    email: string;
    password: string;
    name: string;
}

export class RegisterUserWithCredentialsUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordHasher: PasswordHasher
    ) { }

    async execute(input: RegisterUserWithCredentialsInput): Promise<AuthUser> {
        const existingUser = await this.userRepository.findByEmail(input.email);

        if (existingUser) {
            throw new UserAlreadyExistsException(input.email);
        }

        const passwordHash = await this.passwordHasher.hash(input.password);

        return this.userRepository.createCredentialsUser({
            email: input.email,
            name: input.name,
            passwordHash,
        });
    }
}
