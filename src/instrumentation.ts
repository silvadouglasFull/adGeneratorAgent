import {
    ensureTokenConsumptionConsumerStarted,
    tokenConsumptionContainer,
} from "@/tokenConsumption/tokenConsumption";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await ensureTokenConsumptionConsumerStarted();

        const shutdown = async () => {
            await tokenConsumptionContainer.consumer.stop();
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    }
}
