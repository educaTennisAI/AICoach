import { tool } from "langchain";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { z } from "zod";
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large"
});
const vectorStore = new Chroma(embeddings, {
    collectionName: "educa-ai",
    url: "http://localhost:8000",
    collectionMetadata: {
        "hnsw:space": "cosine",
    },
});
export class Tools {
    constructor(supabase) {
        this.supabase = supabase;
    }
    getUserProfile() {
        return tool(async ({}, config) => {
            try {
                const { ctx } = config.configurable;
                return {
                    success: true,
                    message: "Found User Context",
                    ctx
                };
            }
            catch (err) {
                return {
                    success: false,
                    message: `Error querying user context: ${err}`,
                };
            }
        }, {
            name: "getUserProfile",
            description: "Gets user profile context describing user level, available days, etc. As well as other preferences",
        });
    }
    getLevelGuidelines() {
        return tool(async (input) => {
            try {
                const docs = await vectorStore.similaritySearch("", 1, {
                    "$and": [
                        { "type": "program" },
                        { "levelInt": input.level }
                    ]
                });
                return {
                    success: true,
                    message: "Found level Guidelines",
                    guidelines: docs[0].pageContent
                };
            }
            catch (err) {
                return {
                    success: false,
                    message: `Error searching for level guidelines: ${err}`,
                    guidelines: ""
                };
            }
        }, {
            name: "getLevelGuidelines",
            description: "Get program guidelines for a specific player level",
            schema: z.object({
                level: z.number().describe("Player level: 1- Beginner, 2- Improvement, 3- Advanced, 4- Expert")
            })
        });
    }
    searchExercises() {
        return tool(async (input) => {
            const level = input?.level || 4;
            const topics = input?.topics || [];
            const part = input?.part || "initial";
            const minExercisesPerPart = input?.minExercisesPerPart || 10;
            const filter = input?.filter || {
                "$and": [
                    { "level": level },
                    { "part": part }
                ]
            };
            try {
                const docs = await vectorStore.similaritySearch(topics.join(" "), minExercisesPerPart, filter);
                const exercises = docs.map((doc) => ({
                    pageContent: doc.pageContent,
                    metadata: doc.metadata
                }));
                if (exercises.length === 0) {
                    return {
                        success: false,
                        message: "No exercises found for the given criteria",
                        exercises: []
                    };
                }
                return {
                    success: true,
                    message: `Found ${exercises.length} exercises`,
                    exercises: exercises.map(e => ({
                        part: e.metadata.part,
                        description: e.pageContent,
                    }))
                };
            }
            catch (error) {
                return {
                    success: false,
                    message: `Error searching exercises: ${error}`,
                    exercises: []
                };
            }
        }, {
            name: "searchExercises",
            description: "Search for training exercises in the chroma database. Use this to find exercises for a training session.",
            schema: z.object({
                level: z.number().describe("The level of the player: 1- Beginner, 2- Improvement, 3- Advanced, 4- Expert"),
                topics: z.array(z.string()).describe("Different topics or words to use for similarity search in chroma to retrieve custom content").optional(),
                part: z.enum(["initial", "main", "final"]).describe("Used to filter exercises by part of the training session"),
                minExercisePerPart: z.number().describe("Number of exercises to retrieve").optional(),
                filter: z.object({}).describe("Chroma db query filter").optional()
            }),
        });
    }
    updateUserBlock() {
        return tool(async (input, config) => {
            if (!this.supabase) {
                return {
                    success: false,
                    message: "Supabase client not available",
                };
            }
            try {
                const { error } = await this.supabase
                    .from('profiles')
                    .update({ current_block: input.newBlock })
                    .eq('user_id', input.userId);
                if (error) {
                    return {
                        success: false,
                        message: `Failed to update block: ${error.message}`,
                    };
                }
                return {
                    success: true,
                    message: `Block updated to ${input.newBlock}`,
                    newBlock: input.newBlock,
                    reason: input.reason,
                };
            }
            catch (err) {
                return {
                    success: false,
                    message: `Error updating block: ${err}`,
                };
            }
        }, {
            name: "updateUserBlock",
            description: "Update user's current training block in the database. Call this when the user demonstrates readiness to progress to the next block based on session feedback and performance.",
            schema: z.object({
                userId: z.string().describe("The user ID"),
                newBlock: z.number().describe("The new block number (1-6)"),
                reason: z.string().describe("Reason for block advancement based on user performance"),
            }),
        });
    }
    getTools() {
        return [
            this.searchExercises(),
            this.getLevelGuidelines(),
            this.getUserProfile(),
            this.updateUserBlock()
        ];
    }
}
