import fs from "fs";
import { createProductionPlan } from "./agents/chief-director.js";

const idea = process.argv.slice(2).join(" ");

if (!idea) {
  console.log('اكتب فكرة بعد الأمر. مثال: npm run start -- "قصة مرعبة عن بيت مهجور"');
  process.exit(1);
}

console.log("\nAI Video Factory شغال على الفكرة...\n");

try {
  const plan = await createProductionPlan(idea);

  const fileName = `outputs/production-plan-${Date.now()}.md`;

  fs.writeFileSync(fileName, plan, "utf8");

  console.log(plan);
  console.log(`\nتم حفظ ملف الإنتاج هنا: ${fileName}\n`);
} catch (error) {
  console.error("حصلت مشكلة:", error.message);
}