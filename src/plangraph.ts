import { ChatOpenAI } from "@langchain/openai"
import { Tools } from "./tools.js";
import * as z from "zod";

// Define models 
const nano = new ChatOpenAI({model: "gpt-5.4-nano"});
const llm = new ChatOpenAI({model: "gpt-5.2"});
