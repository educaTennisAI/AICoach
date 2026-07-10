import { createAgent } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Tools } from "./tools.js";
import { WEEKLY_PLANER, SESSION_PLANER, GENERAL_QA, PROGRESS_RECOMMENDATION, BLOCK_ADVANCEMENT, EXTRACT_OBSERVATIONS } from "./prompts.js";

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

  constructor(config: AgentConfig = { model: "gpt-5.6-luna", checkpointer: new MemorySaver }, supabaseClient?: any) {
    // Default config
    config.model ??= "gpt-5.6-luna"; 
    config.checkpointer ??= new MemorySaver(); 
    config.tools ??= new Tools(supabaseClient).getTools();

    this.config = config;
    this.supabase = supabaseClient;
    this.agent = createAgent(config as never);
  }

  async createWeeklyPlan(sessionId: string, userProfile: any, week: string, _prompt: string) {
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
      
      const recentExercises = await this.getRecentExercises(sessionId);
      let prompt = WEEKLY_PLANER
        .replace("{_prompt}", _prompt)
        .replace("{week}", week) 
        .replace("{training_days}", trainingDays)
        .replace("{language}", userProfile.language || 'en')
        .replace("{level}", String(userProfile.level) || 'beginner')
        .replace("{block}", String(userProfile.currentBlock) || '1')
        .replace("{week_before_comp}", weeksBeforeComp)
        .replace("{previous_weeks}", recentExercises)

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

  async createTrainingSession(sessionId: string, userProfile: any, day: string, _prompt: string) {
    try { 
      const recentExercises = await this.getRecentExercises(sessionId);
      const prompt = SESSION_PLANER
        .replace("{_prompt}", _prompt)
        .replace("{day}", day) 
        .replace("{language}", userProfile.language || 'en')
        .replace("{level}", String(userProfile.level) || 'beginner')
        .replace("{block}", String(userProfile.currentBlock) || '1')
        .replace("{previous_weeks}", recentExercises)

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
      const levelInfo = userProfile?.level
        ? `\n\nPlayer Level: ${userProfile.level}`
        : '';
      const systemPrompt = `${GENERAL_QA}${levelInfo}`;

      const result = await this.agent.invoke(
      { 
        messages: [
          new SystemMessage(systemPrompt),
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

  private async getRecentExercises(userId: string): Promise<string> {
    if (!this.supabase) return "No previous session data available.";

    const { data } = await this.supabase
      .from("progress")
      .select("sessions")
      .eq("user_id", userId)
      .eq("area", "session_feedback");

    const allSessions = data?.[0]?.sessions || [];
    if (allSessions.length === 0) return "No previous sessions found.";

    const recent = allSessions.slice(-6);
    return recent.map((s: any) =>
      `[${s.sessionDay}] ${s.exercisesCompleted?.map((e: any) => e.name).join(", ") || "No exercises recorded"}`
    ).join("\n");
  }

  async chatStream(input: { sessionId?: string; messages: { role: string; content: string }[] }) {
    return this.agent.stream(input);
  }

  async extractObservations(params: {
    sessionId: string;
    physicalEffort: number;
    mentalEngagement: number;
    tennisPerformance: string;
    exercises: string;
    language: string;
  }): Promise<{ skill: string; impact: number; confidence: number; reason: string }[]> {
    try {
      const prompt = EXTRACT_OBSERVATIONS
        .replace("{physicalEffort}", String(params.physicalEffort))
        .replace("{mentalEngagement}", String(params.mentalEngagement))
        .replace("{tennisPerformance}", params.tennisPerformance || 'None')
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
