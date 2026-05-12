import { createAgent } from "langchain";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { tools } from "./tools";
import { SESSION_PLANER, GENERAL_QA } from "./prompts";

interface AgentConfig {
  model?: string;
  systemPrompt?: string;
  tools?: never[];
  middleware?: never[];
  skills?: string[];
  memory?: boolean;
  backend?: string;
  checkpointer?: any
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
  private sessions: Map<string, Session> = new Map();
  private agent: ReturnType<typeof createAgent>;

  constructor(config: AgentConfig = { model: "gpt-5.4-nano", checkpointer: new MemorySaver }) {
    // Default config
    config.model ??= "gpt-5.4-nano"; 
    config.checkpointer ??= new MemorySaver(); 
    config.tools ??= tools;

    this.config = config;
    this.agent = createAgent(config as never);
  }

  createSession(sessionId: string): Session {
    const session: Session = {
      id: sessionId,
      language: 'en',
      level: 1,
      history: [],
      createdAt: new Date(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  async createTrainingSession (sessionId: string) {
    try { 
      const session = this.getSession(sessionId) || this.createSession(sessionId);
      const prompt = SESSION_PLANER
        .replace("{language}", session.language)
        .replace("{level}", session.level)

      const result = await this.agent.invoke(
        { 
          messages: [
          new SystemMessage(prompt)
          ]
        },
        { 
          configurable: { 
            thread_id: sessionId 
          } 
        }
      );

      // Get AI Last Message
      const messages = result.messages;
      const lastMessage = messages[messages.length - 1];

      // Update History Training Sessions
      session.history.push(lastMessage.content);

      return result;
    } catch(err) {
      console.error(err)
    }
  }

  async chat(sessionId: string, question: string) {
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
          thread_id: sessionId 
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
