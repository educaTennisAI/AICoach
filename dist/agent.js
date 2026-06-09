import { createAgent } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Tools } from "./tools.js";
import { SESSION_PLANER, GENERAL_QA } from "./prompts.js";
class AICoach {
    constructor(config = { model: "gpt-5.4-nano", checkpointer: new MemorySaver }, supabaseClient) {
        // Default config
        config.model ?? (config.model = "gpt-5.4-nano");
        config.checkpointer ?? (config.checkpointer = new MemorySaver());
        config.tools ?? (config.tools = new Tools(supabaseClient).getTools());
        this.config = config;
        this.supabase = supabaseClient;
        this.agent = createAgent(config);
    }
    async createTrainingSession(sessionId, userProfile, day) {
        try {
            const prompt = SESSION_PLANER
                .replace("{day}", day)
                .replace("{language}", userProfile.language || 'en')
                .replace("{level}", String(userProfile.level) || 'beginner')
                .replace("{block}", String(userProfile.currentBlock) || '1');
            const result = await this.agent.invoke({
                messages: [
                    new SystemMessage(prompt)
                ]
            }, {
                configurable: {
                    thread_id: sessionId,
                    ctx: userProfile,
                }
            });
            return result;
        }
        catch (err) {
            console.error(err);
        }
    }
    async chat(sessionId, question, userProfile) {
        try {
            const result = await this.agent.invoke({
                messages: [
                    new SystemMessage(GENERAL_QA),
                    new HumanMessage(question)
                ]
            }, {
                configurable: {
                    thread_id: sessionId,
                    ctx: userProfile,
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
