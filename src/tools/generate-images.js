import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const projectFolder = process.argv[2];
const testMode = process.argv.includes("--test");

if (!projectFolder) {
  console.log('اكتب مسار المشروع. مثال: node src/tools/generate-images.js "outputs/اسم-المشروع"');
  process.exit(1);
}

const manifestFile = path.join(projectFolder, "manifest.json");

if (!fs.existsSync(manifestFile)) {
  console.log(`مش لاقي manifest.json داخل: ${projectFolder}`);
  process.exit(1);
}

if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
  console.log("مفاتيح Cloudflare ناقصة في ملف .env");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
const queue = manifest.generation_queue || [];

const imageItems = queue.filter((item) =>
  ["character_sheet", "location_sheet", "scene_image", "thumbnail"].includes(item.type)
);

if (!imageItems.length) {
  console.log("مش لاقي عناصر صور داخل generation_queue.");
  process.exit(1);
}

const itemsToGenerate = testMode ? imageItems.slice(0, 1) : imageItems;

const outputFolder = path.join(projectFolder, "generated-images");
fs.mkdirSync(outputFolder, { recursive: true });
async function generateImage(prompt) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      num_steps: 4,
    }),
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  // Cloudflare أحيانًا يرجع الصورة مباشرة
  if (contentType.startsWith("image/")) {
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // وأحيانًا يرجع JSON والصورة Base64 داخل result.image
  if (contentType.includes("application/json")) {
    const data = await response.json();

    if (!data.success) {
      throw new Error(JSON.stringify(data.errors || data));
    }

    if (!data.result?.image) {
      throw new Error("Cloudflare رجّع JSON لكن مش لاقي result.image.");
    }

    return Buffer.from(data.result.image, "base64");
  }

  const unknownResponse = await response.text();
  throw new Error(
    `نوع رد غير متوقع من Cloudflare: ${contentType}\n${unknownResponse.slice(0, 500)}`
  );
}
function getPrompt(item) {
  if (!fs.existsSync(item.file)) {
    throw new Error(`ملف البرومبت مش موجود: ${item.file}`);
  }

  const rawPrompt = fs.readFileSync(item.file, "utf8").trim();

  const safePrompt = rawPrompt
    .replace(/\bthin\b/gi, "average build")
    .replace(/\bwide eyes\b/gi, "alert eyes")
    .replace(/\bterror\b/gi, "fear")
    .replace(/\bscared\b/gi, "worried")
    .replace(/\bcreepy\b/gi, "mysterious")
    .replace(/\bghost\b/gi, "shadowy presence")
    .replace(/\bdead\b/gi, "abandoned")
    .replace(/\bcorpse\b/gi, "empty room")
    .replace(/\bblood\b/gi, "dark red stain")
    .replace(/\bviolent\b/gi, "tense")
    .replace(/\bchild\b/gi, "young adult")
    .replace(/\bchildren\b/gi, "people");

  return `Safe cinematic Egyptian suspense scene, non-violent, no gore, no nudity, fully clothed adults only.

${safePrompt}

Visual style:
${manifest.global_style.global_image_suffix}

Avoid:
${manifest.global_style.global_negative_prompt}`;
}
console.log("\nAI Video Factory بيولّد الصور باستخدام Cloudflare Workers AI...\n");

let successCount = 0;
let failedCount = 0;

for (let index = 0; index < itemsToGenerate.length; index++) {
  const item = itemsToGenerate[index];
  const label = item.id || `scene-${String(item.scene_number).padStart(2, "0")}` || "thumbnail";

  try {
    console.log(`[${index + 1}/${itemsToGenerate.length}] بيولّد: ${label}`);

    const prompt = getPrompt(item);
    const imageBuffer = await generateImage(prompt);

    const outputFile = path.join(outputFolder, `${label}.png`);
if (imageBuffer.length < 1000) {
  throw new Error(`الصورة الناتجة حجمها صغير بشكل مش طبيعي: ${imageBuffer.length} bytes`);
}
    fs.writeFileSync(outputFile, imageBuffer);

    console.log(`✓ تم: ${outputFile}\n`);
    successCount++;
  } catch (error) {
    console.log(`✗ فشل ${label}: ${error.message}\n`);
    failedCount++;
  }
}

console.log("========================================");
console.log(`خلصنا. صور ناجحة: ${successCount}`);
console.log(`صور فشلت: ${failedCount}`);
console.log(`مكان الصور: ${outputFolder}`);
console.log("========================================\n");