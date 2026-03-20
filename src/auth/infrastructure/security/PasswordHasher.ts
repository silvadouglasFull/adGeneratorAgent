import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export class PasswordHasher {
    private readonly keyLength = 64;

    async hash(password: string): Promise<string> {
        const salt = randomBytes(16).toString("hex");
        const derivedKey = (await scrypt(password, salt, this.keyLength)) as Buffer;
        return `${salt}:${derivedKey.toString("hex")}`;
    }

    async verify(password: string, hashedPassword: string): Promise<boolean> {
        const [salt, key] = hashedPassword.split(":");

        if (!salt || !key) {
            return false;
        }

        const hashedBuffer = Buffer.from(key, "hex");
        const suppliedBuffer = (await scrypt(password, salt, this.keyLength)) as Buffer;

        if (hashedBuffer.length !== suppliedBuffer.length) {
            return false;
        }

        return timingSafeEqual(hashedBuffer, suppliedBuffer);
    }
}
