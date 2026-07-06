import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function createProductionPlan(idea) {
  const prompt = `
أنت Chief Director داخل AI Video Factory.

حوّل فكرة الفيديو التالية إلى خطة إنتاج أولية لفيديو قصير باللهجة المصرية:
"${idea}"

اكتب النتيجة بالعربي وبالترتيب ده فقط:

العنوان:
الهوك:
الفكرة الأساسية:
مدة الفيديو المقترحة:
أسلوب السرد:
الشخصيات:
المشاهد:
- مشهد 1:
- مشهد 2:
- مشهد 3:
نهاية الفيديو:
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}