import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function createProductionPlan(idea) {
  const prompt = `
أنت Chief Director وProduction Pipeline Designer داخل AI Video Factory.

حوّل الفكرة التالية إلى ملف إنتاج كامل لفيديو رعب قصير باللهجة المصرية:
"${idea}"

ممنوع أي مقدمة أو شرح أو Markdown.
أرجع JSON صحيح فقط بدون \`\`\`json أو أي كلام خارجه.

المطلوب: ملف جاهز لتوليد الصور، تحريكها، تسجيل الفويس، المونتاج، وتصميم الغلاف.

اتبع هذا الشكل حرفيًا:

{
  "project_title": "",
  "genre": "رعب",
  "target_platform": "Facebook Reels",
  "aspect_ratio": "9:16",
  "target_duration_seconds": 90,
  "hook": "",
  "story_summary": "",

  "global_style": {
    "visual_style": "",
    "lighting_style": "",
    "color_palette": "",
    "cinematography_style": "",
    "render_style": "",
    "global_image_suffix": "",
    "global_negative_prompt": ""
  },

  "voice_style": {
    "language": "Egyptian Arabic",
    "voice_type": "",
    "tone_progression": "",
    "pace": "",
    "recording_notes": ""
  },

  "characters": [
    {
      "id": "char_01",
      "name": "",
      "role": "",
      "appearance": "",
      "wardrobe": "",
      "emotion_baseline": "",
      "character_sheet_prompt": "",
      "consistency_tag": ""
    }
  ],

  "locations": [
    {
      "id": "loc_01",
      "name": "",
      "location_sheet_prompt": "",
      "consistency_tag": ""
    }
  ],

  "assets_needed": [
    {
      "asset_type": "character_sheet | location_sheet | prop | sound_effect | music",
      "name": "",
      "prompt_or_description": "",
      "priority": "high | medium | low"
    }
  ],

  "voice_over": [
    {
      "scene_number": 1,
      "text": "",
      "delivery_note": ""
    }
  ],

  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": 6,
      "title": "",
      "purpose": "",
      "location_id": "loc_01",
      "characters_on_screen": ["char_01"],
      "visual_description_ar": "",
      "shot_type": "",
      "camera_direction": "",
      "lighting": "",
      "image_prompt": "",
      "negative_prompt": "",
      "animation_prompt": "",
      "sfx": [],
      "music_mood": "",
      "transition_in": "",
      "transition_out": "",
      "editing_notes": ""
    }
  ],

  "ending": "",
  "thumbnail": {
    "headline_text_ar": "",
    "thumbnail_prompt": "",
    "thumbnail_negative_prompt": ""
  },

  "facebook": {
    "title": "",
    "description": "",
    "hashtags": []
  }
}

قواعد إجبارية:
1. كل النصوص العربية تكون باللهجة المصرية الطبيعية.
2. image_prompt وanimation_prompt وcharacter_sheet_prompt وlocation_sheet_prompt وnegative_prompt بالإنجليزي فقط.
3. global_image_suffix يحتوي دائمًا على:
   "cinematic realistic Egyptian horror, vertical 9:16, high detail, atmospheric, consistent character design"
4. global_negative_prompt لازم يمنع:
   "text, watermark, logo, subtitles, deformed face, extra fingers, extra limbs, duplicate person, blurry face, cartoon, anime, low quality"
5. اعمل Character Sheet مستقل لكل شخصية تظهر بوضوح.
6. كل شخصية لها consistency_tag قصير مثل:
   "CHAR_AHMED_V1"
7. أي مشهد فيه شخصية لازم image_prompt يبدأ بـ consistency_tag ثم وصف اللقطة، ولا تعيد وصف الشخصية بالكامل في كل مرة.
8. اعمل Location Sheet للمكان الرئيسي، وكل مشهد يستخدم consistency_tag الخاص بالمكان.
9. أي مشهد فيه شخصية لازم characters_on_screen يحتوي id الشخصية.
10. عدد المشاهد من 12 إلى 16.
11. مدة كل مشهد من 4 إلى 8 ثواني.
12. مجموع مدة المشاهد قريب جدًا من 90 ثانية.
13. الفويس أوفر لازم يكون مشهد مقابل مشهد بنفس scene_number.
14. لا تجعل كل المشاهد لقطات ثابتة. نوّع بين wide shot, medium shot, close-up, extreme close-up, POV, over-the-shoulder.
15. كل animation_prompt يصف حركة بسيطة قابلة للتنفيذ من صورة واحدة، بدون تغيير ملامح الشخص أو تحويل المكان.
16. كل مشهد يحتوي sfx كمصفوفة، مثال:
   ["old door creak", "distant wind"]
17. thumbnail_prompt لازم يكون قوي، فيه عنصر رعب واضح، بدون أي كتابة داخل الصورة.
18. لا تستخدم أي شخصيات أو قصص محمية بحقوق نشر.
19. لا تكتب أي شيء خارج JSON.
`;

  async function generateWithRetry(model, prompt) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`محاولة الاتصال بـ ${model}: ${attempt}/${maxAttempts}`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });

      return response.text.trim();
    } catch (error) {
      const message = error?.message || String(error);
      const isBusy = message.includes("503") || message.includes("UNAVAILABLE");

      if (!isBusy || attempt === maxAttempts) {
        throw error;
      }

      const waitSeconds = attempt * 8;
      console.log(`Gemini مشغول. إعادة المحاولة بعد ${waitSeconds} ثواني...`);
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    }
  }
}

  let rawText;

  try {
    rawText = await generateWithRetry("gemini-2.5-flash", prompt);
  } catch (primaryError) {
    console.log("الموديل الأساسي مشغول، بنجرب موديل احتياطي...");

    try {
      rawText = await generateWithRetry("gemini-2.0-flash", prompt);
    } catch {
      throw new Error(
        "خدمة Gemini مشغولة حاليًا. جرّب بعد شوية، أو غيّر GEMINI_MODEL لموديل متاح."
      );
    }
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error("Gemini رجّع JSON بايظ. جرّب تاني.");
  }
}