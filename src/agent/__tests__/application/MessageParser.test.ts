import { MessageParser } from "../../application/stream/MessageParser";

describe("MessageParser", () => {
    it("deve fazer parse de strings diretas", () => {
        const result = MessageParser.parse("Hello World");
        expect(result).toBe("Hello World");
    });

    it("deve fazer parse de arrays com strings", () => {
        const result = MessageParser.parse(["Hello", " ", "World"]);
        expect(result).toBe("Hello World");
    });

    it("deve fazer parse de arrays com objetos com propriedade text", () => {
        const content = [
            { text: "Hello" },
            { text: " " },
            { text: "World" },
        ];
        const result = MessageParser.parse(content);
        expect(result).toBe("Hello World");
    });

    it("deve fazer parse de arrays mistos", () => {
        const content = [
            "Olá",
            { text: " " },
            "Mundo",
            { type: "other" },
            { text: "!" },
        ];
        const result = MessageParser.parse(content);
        expect(result).toBe("Olá Mundo!");
    });

    it("deve retornar empty string para conteúdo inválido", () => {
        expect(MessageParser.parse(null)).toBe("");
        expect(MessageParser.parse(undefined)).toBe("");
        expect(MessageParser.parse(123)).toBe("");
        expect(MessageParser.parse({})).toBe("");
    });

    it("deve retornar empty string para arrays vazios", () => {
        const result = MessageParser.parse([]);
        expect(result).toBe("");
    });

    it("deve ignorar objetos sem propriedade text", () => {
        const content = [
            "Hello",
            { type: "invalid" },
            "World",
        ];
        const result = MessageParser.parse(content);
        expect(result).toBe("HelloWorld");
    });
});
