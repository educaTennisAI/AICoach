import { z } from "zod";
export declare class Tools {
    private supabase;
    constructor(supabase: any);
    getUserProfile(): import("langchain").DynamicTool<{
        success: boolean;
        message: string;
        ctx: any;
    } | {
        success: boolean;
        message: string;
        ctx?: undefined;
    }, unknown>;
    getLevelGuidelines(): import("langchain").DynamicStructuredTool<z.ZodObject<{
        level: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        level: number;
    }, {
        level: number;
    }>, {
        level: number;
    }, {
        level: number;
    }, {
        success: boolean;
        message: string;
        guidelines: string;
    }, unknown, "getLevelGuidelines">;
    searchExercises(): import("langchain").DynamicStructuredTool<z.ZodObject<{
        level: z.ZodNumber;
        topics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        part: z.ZodEnum<["initial", "main", "final"]>;
        minExercisePerPart: z.ZodOptional<z.ZodNumber>;
        filter: z.ZodOptional<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>;
    }, "strip", z.ZodTypeAny, {
        level: number;
        part: "initial" | "main" | "final";
        filter?: {} | undefined;
        topics?: string[] | undefined;
        minExercisePerPart?: number | undefined;
    }, {
        level: number;
        part: "initial" | "main" | "final";
        filter?: {} | undefined;
        topics?: string[] | undefined;
        minExercisePerPart?: number | undefined;
    }>, {
        level?: number;
        topics?: string[];
        part?: string;
        minExercisesPerPart?: number;
        filter: Object;
    } | undefined, {
        level: number;
        part: "initial" | "main" | "final";
        filter?: {} | undefined;
        topics?: string[] | undefined;
        minExercisePerPart?: number | undefined;
    }, {
        success: boolean;
        message: string;
        exercises: {
            part: any;
            description: any;
        }[];
    }, unknown, "searchExercises">;
    updateUserBlock(): import("langchain").DynamicStructuredTool<z.ZodObject<{
        userId: z.ZodString;
        newBlock: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        newBlock: number;
        reason: string;
    }, {
        userId: string;
        newBlock: number;
        reason: string;
    }>, {
        userId: string;
        newBlock: number;
        reason: string;
    }, {
        userId: string;
        newBlock: number;
        reason: string;
    }, {
        success: boolean;
        message: string;
        newBlock?: undefined;
        reason?: undefined;
    } | {
        success: boolean;
        message: string;
        newBlock: number;
        reason: string;
    }, unknown, "updateUserBlock">;
    searchConcepts(): import("langchain").DynamicStructuredTool<z.ZodObject<{
        query: z.ZodString;
        level: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        level?: number | undefined;
    }, {
        query: string;
        level?: number | undefined;
    }>, {
        query: string;
        level?: number | undefined;
    }, {
        query: string;
        level?: number | undefined;
    }, {
        success: boolean;
        message: string;
        concepts: {
            focus: any;
            type: any;
            key_words: any;
            pageContent: any;
        }[];
    }, unknown, "searchConcepts">;
    getTools(): (import("langchain").DynamicTool<{
        success: boolean;
        message: string;
        ctx: any;
    } | {
        success: boolean;
        message: string;
        ctx?: undefined;
    }, unknown> | import("langchain").DynamicStructuredTool<z.ZodObject<{
        level: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        level: number;
    }, {
        level: number;
    }>, {
        level: number;
    }, {
        level: number;
    }, {
        success: boolean;
        message: string;
        guidelines: string;
    }, unknown, "getLevelGuidelines"> | import("langchain").DynamicStructuredTool<z.ZodObject<{
        level: z.ZodNumber;
        topics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        part: z.ZodEnum<["initial", "main", "final"]>;
        minExercisePerPart: z.ZodOptional<z.ZodNumber>;
        filter: z.ZodOptional<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>;
    }, "strip", z.ZodTypeAny, {
        level: number;
        part: "initial" | "main" | "final";
        filter?: {} | undefined;
        topics?: string[] | undefined;
        minExercisePerPart?: number | undefined;
    }, {
        level: number;
        part: "initial" | "main" | "final";
        filter?: {} | undefined;
        topics?: string[] | undefined;
        minExercisePerPart?: number | undefined;
    }>, {
        level?: number;
        topics?: string[];
        part?: string;
        minExercisesPerPart?: number;
        filter: Object;
    } | undefined, {
        level: number;
        part: "initial" | "main" | "final";
        filter?: {} | undefined;
        topics?: string[] | undefined;
        minExercisePerPart?: number | undefined;
    }, {
        success: boolean;
        message: string;
        exercises: {
            part: any;
            description: any;
        }[];
    }, unknown, "searchExercises"> | import("langchain").DynamicStructuredTool<z.ZodObject<{
        userId: z.ZodString;
        newBlock: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        newBlock: number;
        reason: string;
    }, {
        userId: string;
        newBlock: number;
        reason: string;
    }>, {
        userId: string;
        newBlock: number;
        reason: string;
    }, {
        userId: string;
        newBlock: number;
        reason: string;
    }, {
        success: boolean;
        message: string;
        newBlock?: undefined;
        reason?: undefined;
    } | {
        success: boolean;
        message: string;
        newBlock: number;
        reason: string;
    }, unknown, "updateUserBlock"> | import("langchain").DynamicStructuredTool<z.ZodObject<{
        query: z.ZodString;
        level: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        query: string;
        level?: number | undefined;
    }, {
        query: string;
        level?: number | undefined;
    }>, {
        query: string;
        level?: number | undefined;
    }, {
        query: string;
        level?: number | undefined;
    }, {
        success: boolean;
        message: string;
        concepts: {
            focus: any;
            type: any;
            key_words: any;
            pageContent: any;
        }[];
    }, unknown, "searchConcepts">)[];
}
//# sourceMappingURL=tools.d.ts.map