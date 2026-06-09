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
    history: {
        role: string;
        content: string;
    }[];
    createdAt: Date;
}
declare class AICoach {
    private config;
    private agent;
    private supabase;
    constructor(config?: AgentConfig, supabaseClient?: any);
    createTrainingSession(sessionId: string, userProfile: any, day: string): Promise<any>;
    chat(sessionId: string, question: string, userProfile: any): Promise<any>;
    chatStream(input: {
        sessionId?: string;
        messages: {
            role: string;
            content: string;
        }[];
    }): Promise<import("@langchain/core/utils/stream").IterableReadableStream<Record<string, any>>>;
}
export { AICoach, Session, AgentConfig };
//# sourceMappingURL=agent.d.ts.map