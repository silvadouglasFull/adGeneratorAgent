export class InvalidCredentialsException extends Error {
    constructor() {
        super("Credenciais inválidas.");
        this.name = "InvalidCredentialsException";
    }
}
