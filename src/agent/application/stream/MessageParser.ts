export class MessageParser {
    static parse(content: unknown): string {
        if (typeof content === "string") {
            return content;
        }

        if (Array.isArray(content)) {
            return content
                .map((part) => {
                    if (typeof part === "string") {
                        return part;
                    }

                    if (
                        part &&
                        typeof part === "object" &&
                        "text" in part &&
                        typeof (part as { text?: unknown }).text === "string"
                    ) {
                        return (part as { text: string }).text;
                    }

                    return "";
                })
                .join("");
        }

        return "";
    }
}
