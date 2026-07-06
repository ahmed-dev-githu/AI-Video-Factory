import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "قوللي مرحباً يا أحمد، AI Video Factory جاهز للعمل.",
    });

    console.log("\n==============================");
    console.log(response.text);
    console.log("==============================\n");
  } catch (error) {
    console.error(error);
  }
}

main();