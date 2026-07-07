import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log("GEMINI_API_KEY مش موجود في .env");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

try {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.log("حصل خطأ:");
    console.log(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("\n===== الموديلات المتاحة عندك =====\n");

  for (const model of data.models || []) {
    const methods = model.supportedGenerationMethods || [];

    if (
      methods.includes("generateContent") ||
      model.name.toLowerCase().includes("image")
    ) {
      console.log(`الاسم: ${model.name}`);
      console.log(`الطرق: ${methods.join(", ")}`);
      console.log("------------------------------");
    }
  }
} catch (error) {
  console.log("فشل الاتصال:", error.message);
}