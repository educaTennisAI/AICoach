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
export const getLevelGuidelines = tool(async (input) => {
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
export const searchExercises = tool(async (input) => {
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
export const tools = [searchExercises, getLevelGuidelines];
