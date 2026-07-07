import fs from "fs";
import path from "path";
import readline from "readline";
import { spawn } from "child_process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`الأمر فشل بكود: ${code}`));
      }
    });
  });
}

function findLatestProductionPlan() {
  const outputsPath = path.resolve("outputs");

  const files = fs
    .readdirSync(outputsPath)
    .filter((file) => file.startsWith("production-plan-") && file.endsWith(".json"))
    .map((file) => ({
      name: file,
      time: fs.statSync(path.join(outputsPath, file)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (!files.length) {
    throw new Error("ملقتش أي Production Plan داخل outputs.");
  }

  return path.join("outputs", files[0].name);
}

function findLatestProjectFolder() {
  const outputsPath = path.resolve("outputs");

  const folders = fs
    .readdirSync(outputsPath)
    .filter((file) => {
      const fullPath = path.join(outputsPath, file);
      return fs.statSync(fullPath).isDirectory();
    })
    .map((folder) => ({
      name: folder,
      time: fs.statSync(path.join(outputsPath, folder)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (!folders.length) {
    throw new Error("ملقتش فولدر مشروع داخل outputs.");
  }

  return path.join("outputs", folders[0].name);
}

async function main() {
  console.clear();

  console.log(`
========================================
        AI VIDEO FACTORY
========================================
من فكرة لفيديو كامل بدون وجع دماغ يدوي.
`);

  const idea = await ask("اكتب فكرة الفيديو: ");

  if (!idea) {
    console.log("مفيش فكرة يا فنان. البرنامج مش هيقرأ أفكارك بالتخاطر.");
    rl.close();
    process.exit(1);
  }

  console.log("\nبيتم إنشاء ملف الإنتاج...\n");

  try {
    await runCommand("node", ["src/index.js", `"${idea}"`]);

    const productionPlan = findLatestProductionPlan();

    console.log(`
========================================
ملف الإنتاج اتعمل بنجاح.
مكانه:
${productionPlan}
========================================
`);

    const approvePlan = await ask(
      "هل موافق على ملف الإنتاج وتبدأ توليد الصور؟ (y/n): "
    );

    if (approvePlan.toLowerCase() !== "y") {
      console.log(`
تم إيقاف المشروع.
تقدر تعدل ملف الإنتاج يدويًا وبعدها تشغل باقي الأدوات.
مكان الملف:
${productionPlan}
`);
      rl.close();
      return;
    }

    console.log("\nبيتم تجهيز Image Queue...\n");

    await runCommand("node", [
      "src/tools/image-queue-generator.js",
      `"${productionPlan}"`,
    ]);

    const projectFolder = findLatestProjectFolder();

    console.log(`
========================================
مشروع الصور جاهز.
مكان المشروع:
${projectFolder}
========================================
`);

    const approveImages = await ask(
      "هل تبدأ توليد الصور الآن؟ (y/n): "
    );

    if (approveImages.toLowerCase() !== "y") {
      console.log(`
تم إيقاف المشروع قبل توليد الصور.
تقدر تكمل لاحقًا بالأمر:

node src/tools/generate-images.js "${projectFolder}"
`);
      rl.close();
      return;
    }

    console.log("\nبيتم توليد الصور...\n");

    await runCommand("node", [
      "src/tools/generate-images.js",
      `"${projectFolder}"`,
    ]);

    console.log("\nبيتم تجهيز فيديوهات المشاهد...\n");

    await runCommand("node", [
      "src/tools/video-queue-generator.js",
      `"${projectFolder}"`,
    ]);

    console.log("\nبيتم رندر المشاهد...\n");

    await runCommand("node", [
      "src/tools/render-scenes.js",
      `"${projectFolder}"`,
    ]);

    console.log("\nبيتم توليد الفويس أوفر...\n");

    await runCommand("node", [
      "src/tools/generate-voice-over.js",
      `"${projectFolder}"`,
    ]);

    console.log("\nبيتم دمج الصوت مع الفيديو...\n");

    await runCommand("node", [
      "src/tools/merge-video-audio.js",
      `"${projectFolder}"`,
    ]);

    const finalVideo = path.join(projectFolder, "video", "final-v1.mp4");

    console.log(`
========================================
        المشروع خلص يا معلم
========================================

الفيديو النهائي موجود هنا:

${finalVideo}

دلوقتي عندك نسخة أولية كاملة:
- صور
- مشاهد فيديو
- فويس أوفر
- فيديو نهائي

وبكده التطبيق بقى بيشتغل كخط إنتاج بدل ما انت تقعد تكتب أوامر زي موظف أرشيف سنة 1998.
========================================
`);

    rl.close();
  } catch (error) {
    console.log(`
========================================
حصلت مشكلة أثناء التنفيذ:

${error.message}

راجع آخر خطوة ظهرت فوق.
========================================
`);

    rl.close();
  }
}

main();