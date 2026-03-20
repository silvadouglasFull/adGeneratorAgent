// import { runMigrations } from "@/tokenConsumption/infrastructure/db/migrate";
import {
    ensureTokenConsumptionConsumerStarted,
    tokenConsumptionContainer,
} from "@/tokenConsumption/tokenConsumption";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        if (!process.env.HELICONE_API_KEY) {
            console.warn(
                "[Helicone] HELICONE_API_KEY não definida. Custos serão registrados como 0."
            );
        }

        // await runMigrations();
        await ensureTokenConsumptionConsumerStarted();

        const shutdown = async () => {
            await tokenConsumptionContainer.consumer.stop();
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    }
}
