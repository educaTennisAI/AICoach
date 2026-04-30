interface AgentConfig {
    model?: string;
    systemPrompt?: string;
    tools?: never[];
    middleware?: never[];
    skills?: string[];
    memory?: boolean;
    backend?: string;
    checkpointer?: any;
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
    private sessions;
    private agent;
    constructor(config?: AgentConfig);
    createSession(sessionId: string): Session;
    getSession(sessionId: string): Session | undefined;
    deleteSession(sessionId: string): boolean;
    createTrainingSession(sessionId: string): Promise<any>;
    chat(sessionId: string, question: string): Promise<any>;
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