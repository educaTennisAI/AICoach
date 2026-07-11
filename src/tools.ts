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
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  getUserProfile() {
    return tool(
      async ({}, config) => {
        try { 
          const { ctx } = config.configurable as any;
          return {
            success: true,
            message: "Found User Context",
            ctx 
          };
        } catch(err) {
            return {
              success: false,
              message: `Error querying user context: ${err}`,
            };
        }
      }, 
      {
        name: "getUserProfile",
        description: "Gets user profile context describing user level, available days, etc. As well as other preferences",
      }
    );
  }

  getLevelGuidelines() {
    return tool(
      async (input: { level: number}) => {
        try { 
          const docs = await vectorStore.similaritySearch(
            "",
            1,
            {
              "$and": [
                { "type": "program" },
                { "levelInt": input.level }
              ]
            }
          );
          const doc = docs[0] as any;
          return {
            success: true,
            message: "Found level Guidelines",
            guidelines: doc.pageContent,
          };
        } catch(err) {
            return {
              success: false,
              message: `Error searching for level guidelines: ${err}`,
              guidelines: ""
            };
        }
      }, 
      {
        name: "getLevelGuidelines",
        description: "Get program guidelines for a specific player level",
        schema: z.object({
          level: z.number().describe("Player level: 1- Beginner, 2- Improvement, 3- Advanced, 4- Expert")
        })
      }
    );
  }

  searchExercises() {
    return tool(
      async (input: { level?: number; topics?: string[]; part?: string; minExercisesPerPart?: number; filter: Object; excludeIds?: string[] } | undefined) => {
        const level = input?.level || 4;
        const topics = input?.topics || [];
        const part = input?.part || "initial";
        const minExercisesPerPart = input?.minExercisesPerPart || 10;
        const excludeIds = input?.excludeIds || [];
        const filter = input?.filter || {
          "$and": [
            { "level": level },
            { "part": part }
          ]
        };

        try {
          const docs = await vectorStore.similaritySearch(
            topics.join(" "),
            minExercisesPerPart + excludeIds.length,
            filter as any
          );

          const exercises = (docs as any[]).map((doc: any) => ({
            pageContent: doc.pageContent,
            metadata: doc.metadata as any 
          }));

          const filtered = excludeIds.length > 0
            ? exercises.filter(e => !excludeIds.includes(e.metadata?.id))
            : exercises;

          if (filtered.length === 0) {
            return {
              success: false,
              message: "No exercises found for the given criteria",
              exercises: []
            };
          }

          return {
            success: true,
            message: `Found ${filtered.length} exercises`,
            exercises: filtered.map(e => ({
              id: e.metadata?.id,
              part: e.metadata.part,
              description: e.metadata?.description || e.pageContent,
            }))
          };
        } catch (error) {
          return {
            success: false,
            message: `Error searching exercises: ${error}`,
            exercises: []
          };
        }
      },
      {
        name: "searchExercises",
        description: "Search for training exercises in the chroma database. Use this to find exercises for a training session.",
        schema: z.object({
          level: z.number().describe("The level of the player: 1- Beginner, 2- Improvement, 3- Advanced, 4- Expert"),
          topics: z.array(z.string()).describe("Different topics or words to use for similarity search in chroma to retrieve custom content").optional(),
          part: z.enum(["initial", "main", "final"]).describe("Used to filter exercises by part of the training session"),
          minExercisePerPart: z.number().describe("Number of exercises to retrieve").optional(),
          filter: z.object({}).describe("Chroma db query filter").optional(),
          excludeIds: z.array(z.string()).describe("Exercise IDs to exclude from results (already used in prior days). Do NOT include mandatory exercise IDs here.").optional()
        }),
      }
    );
  }

  updateUserBlock() {
    return tool(
      async (input: { userId: string; newBlock: number; reason: string }, config) => {
        
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
        } catch (err) {
          return {
            success: false,
            message: `Error updating block: ${err}`,
          };
        }
      },
      {
        name: "updateUserBlock",
        description: "Update user's current training block in the database. Call this when the user demonstrates readiness to progress to the next block based on session feedback and performance.",
        schema: z.object({
          userId: z.string().describe("The user ID"),
          newBlock: z.number().describe("The new block number (1-6)"),
          reason: z.string().describe("Reason for block advancement based on user performance"),
        }),
      }
    );
  }

  validatePlan() {
    return tool(
      async (input: { planJson: string; mandatoryVideoUrls: string[] }) => {
        try {
          const plan = JSON.parse(input.planJson);
          if (!Array.isArray(plan)) {
            return { success: false, message: "Plan is not an array", violations: [] };
          }

          const mandatory = new Set(input.mandatoryVideoUrls || []);
          const videoMap = new Map<string, string[]>();
          for (const session of plan) {
            const day = session.day;
            for (const ex of session.exercises || []) {
              const video = ex.video;
              if (!video) continue;
              if (mandatory.has(video)) continue;
              if (!videoMap.has(video)) videoMap.set(video, []);
              videoMap.get(video)!.push(day);
            }
          }

          const violations: string[] = [];

          for (const [video, days] of videoMap) {
            if (days.length > 1) {
              violations.push(`Duplicate exercise: "${video}" appears on ${days.join(", ")}. Replace it on all but one day.`);
            }
          }

          // Order check: live ball exercises must always appear before coach/basket/feed exercises in the main part
          for (const session of plan) {
            const mainEx = (session.exercises || []).filter((e: any) =>
              e.part?.toLowerCase() === "main"
            );
            let seenCoach = false;
            for (const ex of mainEx) {
              const method = (ex.method || "").toLowerCase();
              const isCoach = method.includes("coach") || method.includes("basket") || method.includes("feed");
              const isLive = method.includes("live") || method.includes("player");
              if (isCoach) seenCoach = true;
              if (seenCoach && isLive) {
                violations.push(`${session.day}: "${ex.name}" is live ball but appears after coach work. Move all live ball exercises before coach/basket/feed exercises.`);
              }
            }
          }

          if (violations.length === 0) {
            return { success: true, message: "No issues found.", violations: [] };
          }

          return {
            success: false,
            message: `Found ${violations.length} issue(s). Fix them and re-validate.`,
            violations
          };
        } catch (e) {
          return {
            success: false,
            message: `Could not parse plan JSON: ${e}`,
            violations: []
          };
        }
      },
      {
        name: "validatePlan",
        description: "After generating the weekly plan, call this tool to check for duplicate exercises (same video URL) across different days and to verify that all live ball exercises appear before coach/basket/feed exercises in the main part. Pass the mandatory video URLs so they are excluded from the duplicate check. Fix any violations and re-validate.",
        schema: z.object({
          planJson: z.string().describe("The complete weekly plan as a JSON array string"),
          mandatoryVideoUrls: z.array(z.string()).describe("Video URLs of mandatory exercises that are allowed to repeat across all days"),
        }),
      }
    );
  }

  searchConcepts() {
    return tool(
      async (input: { query: string; level?: number }) => {
        const filter: any = { "$and": [{ "type": "concept" }] };
        if (input.level) {
          filter.$and.push({ "level": input.level });
        }

        try {
          const docs = await vectorStore.similaritySearch(
            input.query,
            5,
            filter as any
          );

          const concepts = docs.map((doc: any) => ({
            focus: doc.metadata.focus,
            type: doc.metadata.type,
            key_words: doc.metadata.key_words,
            pageContent: doc.pageContent,
          }));

          if (concepts.length === 0) {
            return {
              success: true,
              message: "No relevant concepts found for your query.",
              concepts: []
            };
          }

          return {
            success: true,
            message: `Found ${concepts.length} relevant concepts`,
            concepts,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error searching concepts: ${error}`,
            concepts: []
          };
        }
      },
      {
        name: "searchConcepts",
        description: "Search for technical and tactical tennis concepts in the knowledge base. Use this tool when the user asks about technique, tactics, footwork, positioning, game patterns, or any tennis-specific topic. Translate the user's question to English and extract only the core concept (2-5 words) as the query.",
        schema: z.object({
          query: z.string().describe("Concise English phrase (2-5 words) describing the core tennis concept. Translate from the user's language if needed. Examples: 'forehand sliding footwork', 'backhand slice approach', 'serve toss consistency'. Do NOT pass the full user question or your elaboration."),
          level: z.number().optional().describe("Player level (1-4) to filter concepts by level"),
        }),
      }
    );
  }

  getTools() {
    return [
      this.searchExercises(), 
      this.searchConcepts(),
      this.getLevelGuidelines(), 
      this.getUserProfile(), 
      this.updateUserBlock(),
      this.validatePlan()
    ];
  }
}
