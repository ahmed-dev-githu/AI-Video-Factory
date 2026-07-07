import fs from "fs";
import path from "path";

const projectFolder = process.argv[2];

if (!projectFolder) {
  console.log('اكتب مسار المشروع. مثال: node src/tools/video-queue-generator.js "outputs/اسم-المشروع"');
  process.exit(1);
}

const manifestPath = path.join(projectFolder, "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.log("مش لاقي manifest.json داخل المشروع.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const videoFolder = path.join(projectFolder, "video");
const imagesFolder = path.join(projectFolder, "generated-images");
const scenesFolder = path.join(projectFolder, "scenes");

fs.mkdirSync(videoFolder, { recursive: true });

const queue = [];

for (const item of manifest.generation_queue) {
  if (item.type !== "scene_image") continue;

  const sceneNumber = String(item.scene_number).padStart(2, "0");
  const scenePromptPath = path.join(scenesFolder, `scene-${sceneNumber}.txt`);
  const imagePath = path.join(imagesFolder, `scene-${sceneNumber}.png`);

  if (!fs.existsSync(scenePromptPath)) {
    console.log(`تحذير: مش لاقي برومبت مشهد ${sceneNumber}`);
    continue;
  }

  if (!fs.existsSync(imagePath)) {
    console.log(`تحذير: مش لاقي صورة مشهد ${sceneNumber}`);
    continue;
  }

  const scenePrompt = fs.readFileSync(scenePromptPath, "utf8");

  queue.push({
    id: `video-scene-${sceneNumber}`,
    scene_number: item.scene_number,
    title: item.title,
    duration_seconds: item.duration_seconds,
    input_image: imagePath,
    output_video: path.join(videoFolder, `scene-${sceneNumber}.mp4`),
    animation_prompt: `
Create subtle cinematic motion from this image.
${scenePrompt}

Keep the character identity, face, clothing, environment, and composition consistent.
Do not add new people.
Do not change the location.
Use realistic natural movement only.
Slow camera movement, subtle handheld horror tension, realistic lighting flicker where appropriate.
Vertical 9:16 cinematic horror video.
    `.trim()
  });
}

const queuePath = path.join(videoFolder, "video-queue.json");

fs.writeFileSync(
  queuePath,
  JSON.stringify(
    {
      project_title: manifest.project_title,
      created_at: new Date().toISOString(),
      total_scenes: queue.length,
      video_queue: queue
    },
    null,
    2
  ),
  "utf8"
);

console.log("\n========================================");
console.log("Video Queue اتعملت بنجاح.");
console.log(`المشروع: ${manifest.project_title}`);
console.log(`عدد المشاهد الجاهزة للتحريك: ${queue.length}`);
console.log(`مكان الملف: ${queuePath}`);
console.log("========================================\n");