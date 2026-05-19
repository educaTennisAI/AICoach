import { z } from "zod";
export declare const getUserProfile: import("langchain").DynamicTool<{
    success: boolean;
    message: string;
    ctx: any;
} | {
    success: boolean;
    message: string;
    ctx?: undefined;
}, unknown>;
export declare const getLevelGuidelines: import("langchain").DynamicStructuredTool<z.ZodObject<{
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
export declare const searchExercises: import("langchain").DynamicStructuredTool<z.ZodObject<{
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
export declare const tools: (import("langchain").DynamicTool<{
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
}, unknown, "searchExercises">)[];
//# sourceMappingURL=tools.d.ts.map