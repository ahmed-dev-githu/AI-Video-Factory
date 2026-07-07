import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const projectFolder = process.argv[2];

if (!projectFolder) {
  console.log('اكتب مسار المشروع. مثال: node src/tools/generate-voice-over.js "outputs/اسم-المشروع"');
  process.exit(1);
}

const manifestPath = path.join(projectFolder, "manifest.json");
const voiceOverPath = path.join(projectFolder, "audio", "voice-over.txt");
const outputPath = path.join(projectFolder, "audio", "voice-over.wav");

if (!fs.existsSync(manifestPath)) {
  console.log("مش لاقي manifest.json داخل المشروع.");
  process.exit(1);
}

if (!fs.existsSync(voiceOverPath)) {
  console.log("مش لاقي audio/voice-over.txt داخل المشروع.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const voiceText = fs.readFileSync(voiceOverPath, "utf8").trim();

if (!voiceText) {
  console.log("ملف الفويس أوفر فاضي.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log("\nAI Video Factory بيولّد الفويس أوفر...\n");

const prompt = `
اقرأ النص التالي باللهجة المصرية الطبيعية.

المطلوب:
- صوت راجل مصري من 28 إلى 38 سنة.
- نبرة هادية، غامضة، سينمائية، مناسبة لقصة رعب.
- سرعة متوسطة وبطء بسيط في الجمل المخيفة.
- وقفات قصيرة بعد الجمل المهمة.
- لا تقرأ أي عناوين أو أرقام مشاهد.
- لا تضيف أي كلام من عندك.
- استخدم أداء تمثيلي خفيف، بدون مبالغة أو صراخ.

النص:
${voiceText}
`.trim();

try {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: prompt,
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Charon"
          }
        }
      }
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];

  const audioPart = parts.find(
    (part) => part.inlineData?.mimeType?.startsWith("audio/")
  );

  if (!audioPart?.inlineData?.data) {
    throw new Error("Gemini ما رجعش ملف صوت.");
  }

  const audioBuffer = Buffer.from(audioPart.inlineData.data, "base64");

  fs.writeFileSync(outputPath, audioBuffer);

  console.log("========================================");
  console.log("الفويس أوفر اتولد بنجاح.");
  console.log(`المشروع: ${manifest.project_title}`);
  console.log(`مكان الملف: ${outputPath}`);
  console.log("========================================\n");
} catch (error) {
  console.log("فشل توليد الفويس أوفر:");
  console.log(error.message);
}