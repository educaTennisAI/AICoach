import { createAgent } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Tools } from "./tools.js";
import { WEEKLY_PLANER, SESSION_PLANER, GENERAL_QA, PROGRESS_RECOMMENDATION, BLOCK_ADVANCEMENT, EXTRACT_OBSERVATIONS } from "./prompts.js";
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
    async createWeeklyPlan(sessionId, userProfile, week, _prompt) {
        try {
            const trainingDays = userProfile.available_days.join(", ");
            let weeksBeforeComp = 'not set';
            if (userProfile.competition_date) {
                const compDate = new Date(userProfile.competition_date);
                const today = new Date();
                const diffTime = compDate.getTime() - today.getTime();
                const weeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
                weeksBeforeComp = String(Math.max(1, weeks));
            }
            const prompt = WEEKLY_PLANER
                .replace("{_prompt}", _prompt)
                .replace("{week}", week)
                .replace("{training_days}", trainingDays)
                .replace("{language}", userProfile.language || 'en')
                .replace("{level}", String(userProfile.level) || 'beginner')
                .replace("{block}", String(userProfile.currentBlock) || '1')
                .replace("{week_before_comp}", weeksBeforeComp);
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
    async createTrainingSession(sessionId, userProfile, day, _prompt) {
        try {
            const prompt = SESSION_PLANER
                .replace("{_prompt}", _prompt)
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
                .replace("{physicalEffort}", String(params.physicalEffort))
                .replace("{mentalEngagement}", String(params.mentalEngagement))
                .replace("{tennisPerformance}", params.tennisPerformance || 'None')
                .replace("{exercises}", params.exercises || 'None')
                .replace("{language}", params.language || 'en');
            const result = await this.agent.invoke({ messages: [new SystemMessage(prompt)] }, { configurable: { thread_id: params.sessionId, ctx: {} } });
            const messages = result.messages;
            const content = messages[messages.length - 1].content;
            try {
                const cleaned = content.replace(/:\s*\+(\d)/g, ': $1');
                const parsed = JSON.parse(cleaned);
                return Array.isArray(parsed) ? parsed : [];
            }
            catch {
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const cleaned = jsonMatch[0].replace(/:\s*\+(\d)/g, ': $1');
                    return JSON.parse(cleaned);
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
