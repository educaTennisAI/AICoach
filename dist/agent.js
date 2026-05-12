import { createAgent } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { tools } from "./tools.js";
import { SESSION_PLANER, GENERAL_QA } from "./prompts.js";
class AICoach {
    constructor(config = { model: "gpt-5.4-nano", checkpointer: new MemorySaver }) {
        this.sessions = new Map();
        // Default config
        config.model ?? (config.model = "gpt-5.4-nano");
        config.checkpointer ?? (config.checkpointer = new MemorySaver());
        config.tools ?? (config.tools = tools);
        this.config = config;
        this.agent = createAgent(config);
    }
    createSession(sessionId) {
        const session = {
            id: sessionId,
            language: 'en',
            level: 1,
            history: [],
            createdAt: new Date(),
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    async createTrainingSession(sessionId) {
        try {
            const session = this.getSession(sessionId) || this.createSession(sessionId);
            const prompt = SESSION_PLANER
                .replace("{language}", session.language)
                .replace("{level}", String(session.level));
            const result = await this.agent.invoke({
                messages: [
                    new SystemMessage(prompt)
                ]
            }, {
                configurable: {
                    thread_id: sessionId
                }
            });
            // Get AI Last Message
            const messages = result.messages;
            const lastMessage = messages[messages.length - 1];
            // Update History Training Sessions
            session.history.push(lastMessage.content);
            return result;
        }
        catch (err) {
            console.error(err);
        }
    }
    async chat(sessionId, question) {
        try {
            const result = await this.agent.invoke({
                messages: [
                    new SystemMessage(GENERAL_QA),
                    new HumanMessage(question)
                ]
            }, {
                configurable: {
                    thread_id: sessionId
                }
            });
            return result;
        }
        catch (err) {
            console.error(err);
        }
    }
    async chatStream(input) {
        return this.agent.stream(input);
    }
}
export { AICoach };
