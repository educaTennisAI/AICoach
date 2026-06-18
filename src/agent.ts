import { createAgent } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Tools } from "./tools.js";
import { SESSION_PLANER, GENERAL_QA, PROGRESS_RECOMMENDATION, BLOCK_ADVANCEMENT, EXTRACT_OBSERVATIONS } from "./prompts.js";

interface AgentConfig {
  model?: string;
  systemPrompt?: string;
  tools?: any[];
  middleware?: never[];
  skills?: string[];
  memory?: boolean;
  backend?: string;
  checkpointer?: any;
  supabase?: any;
}

interface Session {
  id: string;
  language: string;
  level: number;
  history: { role: string; content: string }[];
  createdAt: Date;
}

class AICoach {
  private config: AgentConfig;
  private agent: ReturnType<typeof createAgent>;
  private supabase: any;

  constructor(config: AgentConfig = { model: "gpt-5.4-nano", checkpointer: new MemorySaver }, supabaseClient?: any) {
    // Default config
    config.model ??= "gpt-5.4-nano"; 
    config.checkpointer ??= new MemorySaver(); 
    config.tools ??= new Tools(supabaseClient).getTools();

    this.config = config;
    this.supabase = supabaseClient;
    this.agent = createAgent(config as never);
  }

  async createTrainingSession(sessionId: string, userProfile: any, day: string) {
    try { 
      const prompt = SESSION_PLANER
        .replace("{day}", day) 
        .replace("{language}", userProfile.language || 'en')
        .replace("{level}", String(userProfile.level) || 'beginner')
        .replace("{block}", String(userProfile.currentBlock) || '1')

      const result = await this.agent.invoke(
        { 
          messages: [
          new SystemMessage(prompt)
          ]
        },
        { 
          configurable: { 
            thread_id: sessionId,
            ctx: userProfile,
          } 
        }
      );

      return result;
    } catch(err) {
      console.error(err)
    }
  }

  async chat(sessionId: string, question: string, userProfile: any) {
    try {
      const result = await this.agent.invoke(
      { 
        messages: [
          new SystemMessage(GENERAL_QA),
          new HumanMessage(question)
        ]
      },
      { 
        configurable: { 
          thread_id: sessionId,
          ctx: userProfile,
        } 
      }
      );
      return result;
    } catch(err) {
      console.error(err);
    }
  }

  async getRecommendation(params: {
    sessionId: string;
    level: number;
    levelName: string;
    block: number;
    maxBlocks: number;
    blockName: string;
    blockObjective: string;
    totalSessions: number;
    streak: number;
    sessionHistory: string;
    language: string;
  }): Promise<string> {
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

      const result = await this.agent.invoke(
        { messages: [new SystemMessage(prompt)] },
        { configurable: { thread_id: params.sessionId, ctx: {} } }
      );

      const messages = result.messages;
      let content = messages[messages.length - 1].content as string;

      content = content.replace(/^```(?:markdown)?\n?/i, '').replace(/\n?```$/i, '').trim();

      return content;
    } catch (err) {
      console.error('Error getting recommendation:', err);
      return 'Unable to generate recommendation right now.';
    }
  }

  async evaluateBlockAdvancement(params: {
    sessionId: string;
    level: number;
    levelName: string;
    block: number;
    maxBlocks: number;
    blockName: string;
    blockObjective: string;
    sessionHistory: string;
    language: string;
  }): Promise<{ advance: boolean; reason: string }> {
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

      const result = await this.agent.invoke(
        { messages: [new SystemMessage(prompt)] },
        { configurable: { thread_id: params.sessionId, ctx: {} } }
      );

      const messages = result.messages;
      const content = messages[messages.length - 1].content as string;

      try {
        return JSON.parse(content);
      } catch {
        const advanceMatch = content.includes('"advance": true');
        return { advance: advanceMatch, reason: content };
      }
    } catch (err) {
      console.error('Error evaluating block advancement:', err);
      return { advance: false, reason: 'Error during evaluation' };
    }
  }

  async chatStream(input: { sessionId?: string; messages: { role: string; content: string }[] }) {
    return this.agent.stream(input);
  }

  async extractObservations(params: {
    sessionId: string;
    difficulty: string;
    energyLevel: string;
    notes: string;
    struggles: string[];
    exercises: string;
    language: string;
  }): Promise<{ skill: string; impact: number; confidence: number; reason: string }[]> {
    try {
      const prompt = EXTRACT_OBSERVATIONS
        .replace("{difficulty}", params.difficulty)
        .replace("{energyLevel}", params.energyLevel)
        .replace("{notes}", params.notes || 'None')
        .replace("{struggles}", params.struggles?.join(', ') || 'None')
        .replace("{exercises}", params.exercises || 'None')
        .replace("{language}", params.language || 'en');

      const result = await this.agent.invoke(
        { messages: [new SystemMessage(prompt)] },
        { configurable: { thread_id: params.sessionId, ctx: {} } }
      );

      const messages = result.messages;
      const content = messages[messages.length - 1].content as string;

      try {
        const cleaned = content.replace(/:\s*\+(\d)/g, ': $1');
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const cleaned = jsonMatch[0].replace(/:\s*\+(\d)/g, ': $1');
          return JSON.parse(cleaned);
        }
        return [];
      }
    } catch (err) {
      console.error('Error extracting observations:', err);
      return [];
    }
  }
}

export { AICoach, Session, AgentConfig };
