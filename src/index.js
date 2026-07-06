import fs from "fs";
import path from "path";
import { createProductionPlan } from "./agents/chief-director.js";

const idea = process.argv.slice(2).join(" ");

if (!idea) {
  console.log('اكتب فكرة بعد الأمر. مثال: npm run start -- "قصة رعب عن شقة قديمة"');
  process.exit(1);
}

console.log("\nAI Video Factory بيجهز ملف الإنتاج...\n");

try {
  const productionPlan = await createProductionPlan(idea);

  const timestamp = Date.now();
  const jsonFile = path.join("outputs", `production-plan-${timestamp}.json`);
  const textFile = path.join("outputs", `production-plan-${timestamp}.txt`);

  fs.writeFileSync(jsonFile, JSON.stringify(productionPlan, null, 2), "utf8");

  const preview = `
العنوان: ${productionPlan.project_title}

الهوك:
${productionPlan.hook}

عدد المشاهد: ${productionPlan.scenes.length}

ملف JSON الكامل:
${jsonFile}
`;

  fs.writeFileSync(textFile, preview, "utf8");

  console.log(preview);
  console.log("\nتم إنشاء ملف إنتاج منظم بنجاح.\n");
} catch (error) {
  console.error("\nحصلت مشكلة:", error.message);
}