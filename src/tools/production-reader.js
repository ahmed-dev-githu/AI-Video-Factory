import fs from "fs";

const filePath = process.argv[2];

if (!filePath) {
  console.log("اكتب مسار ملف الإنتاج بعد الأمر.");
  console.log('مثال: node src/tools/production-reader.js "outputs/production-plan-123.json"');
  process.exit(1);
}

const plan = JSON.parse(fs.readFileSync(filePath, "utf8"));

console.log("\n========================================");
console.log(`العنوان: ${plan.project_title}`);
console.log(`النوع: ${plan.genre}`);
console.log(`المنصة: ${plan.target_platform}`);
console.log(`المقاس: ${plan.aspect_ratio}`);
console.log(`المدة: ${plan.target_duration_seconds} ثانية`);
console.log("========================================\n");

console.log("الهوك:");
console.log(`${plan.hook}\n`);

console.log("ملخص القصة:");
console.log(`${plan.story_summary}\n`);

console.log("========== GLOBAL STYLE ==========\n");

console.log(`Visual Style: ${plan.global_style?.visual_style || "غير موجود"}`);
console.log(`Lighting: ${plan.global_style?.lighting_style || "غير موجود"}`);
console.log(`Color Palette: ${plan.global_style?.color_palette || "غير موجود"}`);
console.log(`Cinematography: ${plan.global_style?.cinematography_style || "غير موجود"}`);
console.log(`Render Style: ${plan.global_style?.render_style || "غير موجود"}`);
console.log(`Image Suffix: ${plan.global_style?.global_image_suffix || "غير موجود"}`);
console.log(`Negative Prompt: ${plan.global_style?.global_negative_prompt || "غير موجود"}\n`);

console.log("========== VOICE STYLE ==========\n");

console.log(`Language: ${plan.voice_style?.language || "Egyptian Arabic"}`);
console.log(`Voice Type: ${plan.voice_style?.voice_type || "غير موجود"}`);
console.log(`Tone Progression: ${plan.voice_style?.tone_progression || "غير موجود"}`);
console.log(`Pace: ${plan.voice_style?.pace || "غير موجود"}`);
console.log(`Recording Notes: ${plan.voice_style?.recording_notes || "غير موجود"}\n`);

console.log("========== CHARACTERS ==========\n");

for (const character of plan.characters || []) {
  console.log(`ID: ${character.id}`);
  console.log(`الاسم: ${character.name}`);
  console.log(`الدور: ${character.role}`);
  console.log(`Appearance: ${character.appearance}`);
  console.log(`Wardrobe: ${character.wardrobe}`);
  console.log(`Emotion Baseline: ${character.emotion_baseline}`);
  console.log(`Consistency Tag: ${character.consistency_tag}`);
  console.log(`Character Sheet Prompt:\n${character.character_sheet_prompt}`);
  console.log("----------------------------------------");
}

console.log("\n========== LOCATIONS ==========\n");

for (const location of plan.locations || []) {
  console.log(`ID: ${location.id}`);
  console.log(`الاسم: ${location.name}`);
  console.log(`Consistency Tag: ${location.consistency_tag}`);
  console.log(`Location Sheet Prompt:\n${location.location_sheet_prompt}`);
  console.log("----------------------------------------");
}

console.log("\n========== ASSETS NEEDED ==========\n");

for (const asset of plan.assets_needed || []) {
  console.log(`[${asset.priority}] ${asset.asset_type}: ${asset.name}`);
  console.log(asset.prompt_or_description);
  console.log("----------------------------------------");
}

console.log("\n========== VOICE OVER ==========\n");

for (const item of plan.voice_over || []) {
  console.log(`[مشهد ${item.scene_number}] ${item.text}`);
  console.log(`Delivery: ${item.delivery_note || "عادي"}`);
  console.log("----------------------------------------");
}

console.log("\n========== SCENES ==========\n");

for (const scene of plan.scenes || []) {
  console.log(`\nمشهد ${scene.scene_number}: ${scene.title}`);
  console.log(`المدة: ${scene.duration_seconds} ثواني`);
  console.log(`Purpose: ${scene.purpose}`);
  console.log(`Location: ${scene.location_id}`);
  console.log(`Characters: ${(scene.characters_on_screen || []).join(", ") || "بدون"}`);
  console.log(`الوصف: ${scene.visual_description_ar}`);
  console.log(`Shot Type: ${scene.shot_type}`);
  console.log(`Camera: ${scene.camera_direction}`);
  console.log(`Lighting: ${scene.lighting}`);
  console.log(`\nIMAGE PROMPT:\n${scene.image_prompt}`);
  console.log(`\nNEGATIVE PROMPT:\n${scene.negative_prompt}`);
  console.log(`\nANIMATION PROMPT:\n${scene.animation_prompt}`);
  console.log(`\nSFX: ${(scene.sfx || []).join(" | ")}`);
  console.log(`Music: ${scene.music_mood}`);
  console.log(`Transition In: ${scene.transition_in}`);
  console.log(`Transition Out: ${scene.transition_out}`);
  console.log(`Editing Notes: ${scene.editing_notes}`);
  console.log("========================================");
}

console.log("\n========== THUMBNAIL ==========\n");
console.log(`النص المقترح: ${plan.thumbnail?.headline_text_ar || "غير موجود"}`);
console.log(`Prompt:\n${plan.thumbnail?.thumbnail_prompt || "غير موجود"}`);
console.log(`Negative Prompt:\n${plan.thumbnail?.thumbnail_negative_prompt || "غير موجود"}`);

console.log("\n========== FACEBOOK ==========\n");
console.log(`العنوان: ${plan.facebook?.title || "غير موجود"}`);
console.log(`الوصف: ${plan.facebook?.description || "غير موجود"}`);
console.log(`هاشتاجات: ${(plan.facebook?.hashtags || []).join(" ")}`);