import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const projectFolder = process.argv[2];

if (!projectFolder) {
  console.log('اكتب مسار المشروع. مثال: node src/tools/render-video-from-images.js "outputs/اسم-المشروع"');
  process.exit(1);
}

const queuePath = path.join(projectFolder, "video", "video-queue.json");

if (!fs.existsSync(queuePath)) {
  console.log("مش لاقي video-queue.json. شغّل video-queue-generator الأول.");
  process.exit(1);
}

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.log("FFmpeg مش متثبت أو مش موجود في PATH.");
  console.log("ثبّته الأول ثم افتح Terminal جديد وجرب تاني.");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(queuePath, "utf8"));
const renderedFolder = path.join(projectFolder, "video", "rendered-scenes");

fs.mkdirSync(renderedFolder, { recursive: true });

console.log("\nAI Video Factory بيرندر المشاهد من الصور...\n");

const renderedFiles = [];

for (const scene of data.video_queue) {
  const number = String(scene.scene_number).padStart(2, "0");
  const outputFile = path.join(renderedFolder, `scene-${number}.mp4`);
  const duration = scene.duration_seconds || 6;

  console.log(`[${scene.scene_number}/${data.video_queue.length}] بيرندر: ${scene.title}`);

  const filter = [
    "scale=1080:1920:force_original_aspect_ratio=increase",
    "crop=1080:1920",
    `zoompan=z='min(zoom+0.0007,1.12)':d=${duration * 30}:s=1080x1920:fps=30`,
    "format=yuv420p"
  ].join(",");

  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-loop", "1",
        "-i", scene.input_image,
        "-vf", filter,
        "-t", String(duration),
        "-r", "30",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        outputFile
      ],
      { stdio: "pipe" }
    );

    renderedFiles.push(outputFile);
    console.log(`✓ تم: scene-${number}.mp4\n`);
  } catch {
    console.log(`✗ فشل مشهد ${scene.scene_number}\n`);
  }
}

const concatFile = path.join(renderedFolder, "concat.txt");

fs.writeFileSync(
  concatFile,
  renderedFiles
    .map((file) => `file '${path.resolve(file).replace(/\\/g, "/")}'`)
    .join("\n"),
  "utf8"
);

const finalVideo = path.join(projectFolder, "video", "rough-cut.mp4");

if (renderedFiles.length > 0) {
  console.log("بيجمع الفيديو النهائي...");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", concatFile,
      "-c", "copy",
      finalVideo
    ],
    { stdio: "inherit" }
  );

  console.log("\n========================================");
  console.log("النسخة الأولية اتعملت بنجاح.");
  console.log(`المشاهد الناجحة: ${renderedFiles.length}/${data.video_queue.length}`);
  console.log(`الفيديو: ${finalVideo}`);
  console.log("========================================\n");
}