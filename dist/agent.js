import { createAgent } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Tools } from "./tools.js";
import { SESSION_PLANER, GENERAL_QA, PROGRESS_RECOMMENDATION, BLOCK_ADVANCEMENT, EXTRACT_OBSERVATIONS } from "./prompts.js";
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
    async getRecommendation(params) {
        try {
            const prompt = PROGRESS_RECOMMENDATION
                .replace("{level}", String(params.level))
                .replace("{levelName}", params.levelName)
                .replace("{block}", String(params.block))
                .replace("{maxBlocks}", String(params.maxBlocks))
                .replace("{blockName}", params.blockName)
                .replace("{blockObjective}", params.blockObjective)
                .replace("{totalSessions}", String(params.totalSessions))
                .replace("{streak}", String(params.streak))
                .replace("{sessionHistory}", params.sessionHistory)
                .replace("{language}", params.language || 'en');
            const result = await this.agent.invoke({ messages: [new SystemMessage(prompt)] }, { configurable: { thread_id: params.sessionId, ctx: {} } });
            const messages = result.messages;
            let content = messages[messages.length - 1].content;
            content = content.replace(/^```(?:markdown)?\n?/i, '').replace(/\n?```$/i, '').trim();
            return content;
        }
        catch (err) {
            console.error('Error getting recommendation:', err);
            return 'Unable to generate recommendation right now.';
        }
    }
    async evaluateBlockAdvancement(params) {
        try {
            const prompt = BLOCK_ADVANCEMENT
                .replace("{level}", String(params.level))
                .replace("{levelName}", params.levelName)
                .replace("{block}", String(params.block))
                .replace("{maxBlocks}", String(params.maxBlocks))
                .replace("{blockName}", params.blockName)
                .replace("{blockObjective}", params.blockObjective)
                .replace("{sessionHistory}", params.sessionHistory)
                .replace("{language}", params.language || 'en');
            const result = await this.agent.invoke({ messages: [new SystemMessage(prompt)] }, { configurable: { thread_id: params.sessionId, ctx: {} } });
            const messages = result.messages;
            const content = messages[messages.length - 1].content;
            try {
                return JSON.parse(content);
            }
            catch {
                const advanceMatch = content.includes('"advance": true');
                return { advance: advanceMatch, reason: content };
            }
        }
        catch (err) {
            console.error('Error evaluating block advancement:', err);
            return { advance: false, reason: 'Error during evaluation' };
        }
    }
    async chatStream(input) {
        return this.agent.stream(input);
    }
    async extractObservations(params) {
        try {
            const prompt = EXTRACT_OBSERVATIONS
                .replace("{difficulty}", params.difficulty)
                .replace("{energyLevel}", params.energyLevel)
                .replace("{notes}", params.notes || 'None')
                .replace("{struggles}", params.struggles?.join(', ') || 'None')
                .replace("{exercises}", params.exercises || 'None')
                .replace("{language}", params.language || 'en');
            const result = await this.agent.invoke({ messages: [new SystemMessage(prompt)] }, { configurable: { thread_id: params.sessionId, ctx: {} } });
            const messages = result.messages;
            const content = messages[messages.length - 1].content;
            try {
                const parsed = JSON.parse(content);
                return Array.isArray(parsed) ? parsed : [];
            }
            catch {
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                return [];
            }
        }
        catch (err) {
            console.error('Error extracting observations:', err);
            return [];
        }
    }
}
export { AICoach };
