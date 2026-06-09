import { createAgent } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Tools } from "./tools.js";
import { SESSION_PLANER, GENERAL_QA } from "./prompts.js";

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

  async chatStream(input: { sessionId?: string; messages: { role: string; content: string }[] }) {
    return this.agent.stream(input);
  }
}

export { AICoach, Session, AgentConfig };
