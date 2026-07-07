import fs from "fs";
import path from "path";

const inputFile = process.argv[2];

if (!inputFile) {
  console.log('اكتب مسار ملف الإنتاج. مثال: node src/tools/image-queue-generator.js "outputs/production-plan-123.json"');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.log(`الملف مش موجود: ${inputFile}`);
  process.exit(1);
}

const plan = JSON.parse(fs.readFileSync(inputFile, "utf8"));

const safeName = (plan.project_title || "untitled-project")
  .replace(/[<>:"/\\|?*]/g, "")
  .replace(/\s+/g, "-")
  .slice(0, 60);

const projectFolder = path.join("outputs", `${safeName}-${Date.now()}`);
const folders = {
  root: projectFolder,
  characters: path.join(projectFolder, "characters"),
  locations: path.join(projectFolder, "locations"),
  scenes: path.join(projectFolder, "scenes"),
  thumbnail: path.join(projectFolder, "thumbnail"),
  audio: path.join(projectFolder, "audio"),
  video: path.join(projectFolder, "video"),
};

for (const folder of Object.values(folders)) {
  fs.mkdirSync(folder, { recursive: true });
}

const globalStyle = plan.global_style || {};
const globalSuffix =
  globalStyle.global_image_suffix ||
  plan.visual_style ||
  "cinematic horror, vertical 9:16, dramatic lighting, detailed environment";

const globalNegative =
  globalStyle.global_negative_prompt ||
  "blurry, low quality, distorted face, extra fingers, bad anatomy, watermark, text, logo";

const manifest = {
  project_title: plan.project_title,
  source_production_plan: inputFile,
  created_at: new Date().toISOString(),
  global_style: globalStyle,
  folders,
  generation_queue: [],
};

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content.trim() + "\n", "utf8");
}

for (const character of plan.characters || []) {
  const fileName = `${character.id || character.name || "character"}.txt`;
  const filePath = path.join(folders.characters, fileName);

  const prompt =
    character.character_sheet_prompt ||
    character.character_sheet ||
    `${character.name || "Character"}, ${character.appearance || ""}, ${character.wardrobe || ""}, full character sheet, front view, side view, back view, expressions sheet, ${globalSuffix}`;

  writeText(
    filePath,
    `CHARACTER: ${character.name || "غير معروف"}
ROLE: ${character.role || "غير معروف"}

IMAGE PROMPT:
${prompt}

NEGATIVE PROMPT:
${globalNegative}`
  );

  manifest.generation_queue.push({
    type: "character_sheet",
    id: character.id || character.name,
    file: filePath,
    priority: "high",
  });
}

for (const location of plan.locations || []) {
  const fileName = `${location.id || location.name || "location"}.txt`;
  const filePath = path.join(folders.locations, fileName);

  const prompt =
    location.location_sheet_prompt ||
    `${location.name || "Location"}, environment concept sheet, wide shot, detail shots, ${location.consistency_tag || ""}, ${globalSuffix}`;

  writeText(
    filePath,
    `LOCATION: ${location.name || "غير معروف"}

IMAGE PROMPT:
${prompt}

NEGATIVE PROMPT:
${globalNegative}`
  );

  manifest.generation_queue.push({
    type: "location_sheet",
    id: location.id || location.name,
    file: filePath,
    priority: "high",
  });
}

for (const scene of plan.scenes || []) {
  const sceneNumber = String(scene.scene_number || 0).padStart(2, "0");
  const fileName = `scene-${sceneNumber}.txt`;
  const filePath = path.join(folders.scenes, fileName);

  const imagePrompt =
    scene.image_prompt ||
    `${scene.visual_description_ar || scene.visual_description || ""}, ${globalSuffix}`;

  const negativePrompt = scene.negative_prompt || globalNegative;

  writeText(
    filePath,
    `SCENE ${scene.scene_number}: ${scene.title || ""}

DURATION: ${scene.duration_seconds || 0} seconds
LOCATION: ${scene.location_id || "غير محدد"}
CHARACTERS: ${(scene.characters_on_screen || []).join(", ") || "بدون"}

IMAGE PROMPT:
${imagePrompt}

NEGATIVE PROMPT:
${negativePrompt}

ANIMATION PROMPT:
${scene.animation_prompt || "Slow cinematic movement, subtle natural motion, no fast cuts."}

CAMERA:
${scene.camera_direction || scene.shot_type || "Cinematic shot"}

SFX:
${(scene.sfx || []).join(" | ") || scene.sound_effects || "none"}

MUSIC:
${scene.music_mood || "dark cinematic atmosphere"}

EDITING NOTES:
${scene.editing_notes || "Cut on action, keep tension rising."}`
  );

  manifest.generation_queue.push({
    type: "scene_image",
    scene_number: scene.scene_number,
    title: scene.title,
    duration_seconds: scene.duration_seconds,
    file: filePath,
    priority: "normal",
  });
}

const thumbnail = plan.thumbnail || {};
const thumbnailPrompt =
  thumbnail.thumbnail_prompt ||
  plan.thumbnail_prompt ||
  `${plan.project_title || "Horror story"} thumbnail, Egyptian horror, dramatic face, dark apartment background, bold composition, vertical 9:16, ${globalSuffix}`;

const thumbnailFile = path.join(folders.thumbnail, "thumbnail.txt");

writeText(
  thumbnailFile,
  `HEADLINE TEXT:
${thumbnail.headline_text_ar || plan.project_title || ""}

THUMBNAIL PROMPT:
${thumbnailPrompt}

NEGATIVE PROMPT:
${thumbnail.thumbnail_negative_prompt || globalNegative}`
);

manifest.generation_queue.push({
  type: "thumbnail",
  file: thumbnailFile,
  priority: "high",
});

const voiceOverFile = path.join(folders.audio, "voice-over.txt");
const voiceOverText = (plan.voice_over || [])
  .map((item) => `[مشهد ${item.scene_number}]\n${item.text}\n${item.delivery_note ? `الأداء: ${item.delivery_note}` : ""}`)
  .join("\n\n");

writeText(voiceOverFile, voiceOverText || "لا يوجد فويس أوفر.");

manifest.generation_queue.push({
  type: "voice_over",
  file: voiceOverFile,
  priority: "high",
});

const manifestFile = path.join(projectFolder, "manifest.json");
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), "utf8");

const readmeFile = path.join(projectFolder, "README.txt");
writeText(
  readmeFile,
  `AI VIDEO FACTORY - IMAGE QUEUE

1. ابدأ بملفات characters لتوليد Character Sheets.
2. بعدها locations لتوليد Location Sheets.
3. بعدها scenes بالترتيب من scene-01 إلى آخر مشهد.
4. استخدم audio/voice-over.txt في Gemini TTS.
5. thumbnail/thumbnail.txt للغلاف.
6. manifest.json فيه ترتيب كل الملفات.

المشروع: ${plan.project_title}
عدد المشاهد: ${(plan.scenes || []).length}
`
);

console.log("\n========================================");
console.log("Image Queue اتعملت بنجاح.");
console.log(`المشروع: ${plan.project_title}`);
console.log(`المجلد: ${projectFolder}`);
console.log(`عدد عناصر التوليد: ${manifest.generation_queue.length}`);
console.log("========================================\n");