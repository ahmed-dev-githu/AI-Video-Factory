import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function createProductionPlan(idea) {
  const prompt = `
أنت مدير إنتاج محترف داخل AI Video Factory.

حوّل الفكرة التالية إلى ملف إنتاج جاهز لفيديو رعب قصير باللهجة المصرية:
"${idea}"

ممنوع كتابة مقدمة أو شرح أو Markdown.
أرجع JSON صحيح فقط، بدون علامات \`\`\`json.

اتبع هذا الشكل حرفيًا:

{
  "project_title": "",
  "genre": "رعب",
  "target_platform": "Facebook Reels",
  "target_duration_seconds": 90,
  "hook": "",
  "story_summary": "",
  "visual_style": "",
  "voice_style": "",
  "characters": [
    {
      "id": "char_01",
      "name": "",
      "role": "",
      "character_sheet": ""
    }
  ],
  "voice_over": [
    {
      "scene_number": 1,
      "text": ""
    }
  ],
  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": 8,
      "title": "",
      "visual_description": "",
      "camera_direction": "",
      "image_prompt": "",
      "animation_prompt": "",
      "sound_effects": "",
      "music_mood": ""
    }
  ],
  "ending": "",
  "thumbnail_prompt": "",
  "facebook_title": "",
  "facebook_description": "",
  "hashtags": []
}

القواعد:
- اكتب كل النصوص بالعربي المصري الطبيعي.
- مدة كل مشهد من 4 إلى 8 ثواني.
- مجموع مدة المشاهد قريب من target_duration_seconds.
- اعمل من 12 إلى 16 مشهد.
- لازم كل مشهد يزود التوتر ويخدم القصة.
- image_prompt وanimation_prompt يكونوا بالإنجليزي لأن أدوات الصور والفيديو بتفهمه أفضل.
- ثبّت وصف الشخصيات في كل برومبت يظهر فيه شخص.
- لا تستخدم شخصيات أو قصص محمية بحقوق نشر.
- لا تكتب أي شيء خارج JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const rawText = response.text.trim();

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error("Gemini رجّع JSON بايظ. جرّب تاني.");
  }
}