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
    getRecommendation(params: {
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
    }): Promise<string>;
    evaluateBlockAdvancement(params: {
        sessionId: string;
        level: number;
        levelName: string;
        block: number;
        maxBlocks: number;
        blockName: string;
        blockObjective: string;
        sessionHistory: string;
        language: string;
    }): Promise<{
        advance: boolean;
        reason: string;
    }>;
    chatStream(input: {
        sessionId?: string;
        messages: {
            role: string;
            content: string;
        }[];
    }): Promise<import("@langchain/core/utils/stream").IterableReadableStream<Record<string, any>>>;
    extractObservations(params: {
        sessionId: string;
        difficulty: string;
        energyLevel: string;
        notes: string;
        struggles: string[];
        exercises: string;
        language: string;
    }): Promise<{
        skill: string;
        impact: number;
        confidence: number;
        reason: string;
    }[]>;
}
export { AICoach, Session, AgentConfig };
//# sourceMappingURL=agent.d.ts.map