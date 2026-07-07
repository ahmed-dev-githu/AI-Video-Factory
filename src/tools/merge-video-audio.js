import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const projectFolder = process.argv[2];

if (!projectFolder) {
  console.log('اكتب مسار المشروع. مثال: node src/tools/merge-video-audio.js "outputs/اسم-المشروع"');
  process.exit(1);
}

const videoPath = path.join(projectFolder, "video", "rough-cut.mp4");
const rawAudioPath = path.join(projectFolder, "audio", "voice-over.wav");
const convertedAudioPath = path.join(projectFolder, "audio", "voice-over-final.wav");
const finalVideoPath = path.join(projectFolder, "video", "final-v1.mp4");

if (!fs.existsSync(videoPath)) {
  console.log("مش لاقي rough-cut.mp4");
  process.exit(1);
}

if (!fs.existsSync(rawAudioPath)) {
  console.log("مش لاقي voice-over.wav");
  process.exit(1);
}

try {
  console.log("\nبيحوّل الفويس أوفر لصيغة WAV سليمة...");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-f", "s16le",
      "-ar", "24000",
      "-ac", "1",
      "-i", rawAudioPath,
      convertedAudioPath
    ],
    { stdio: "pipe" }
  );

  console.log("بيدمج الصوت مع الفيديو...");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i", videoPath,
      "-i", convertedAudioPath,
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      "-movflags", "+faststart",
      finalVideoPath
    ],
    { stdio: "pipe" }
  );

  console.log("\n========================================");
  console.log("النسخة الأولية بالصوت اتعملت.");
  console.log(`الفيديو النهائي: ${finalVideoPath}`);
  console.log("========================================\n");
} catch (error) {
  console.log("حصلت مشكلة أثناء الدمج:");
  console.log(error.stderr?.toString() || error.message);
}