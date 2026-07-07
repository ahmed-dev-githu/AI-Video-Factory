import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !apiToken) {
  console.log("حط CLOUDFLARE_ACCOUNT_ID و CLOUDFLARE_API_TOKEN في ملف .env الأول.");
  process.exit(1);
}

const model = "@cf/stabilityai/stable-diffusion-xl-base-1.0";
const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

const prompt =
  "cinematic Egyptian horror apartment hallway at night, dusty old wooden door, dramatic shadows, realistic film still, vertical composition";

console.log("\nAI Video Factory بيختبر Cloudflare Workers AI...\n");

try {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      num_steps: 20,
      guidance: 7.5,
      width: 768,
      height: 1024,
    }),
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    console.log("فشل الاختبار:");
    console.log(await response.text());
    process.exit(1);
  }

  if (!contentType.includes("image")) {
    console.log("Cloudflare رجّع رد مش صورة:");
    console.log(await response.text());
    process.exit(1);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const outputFile = "outputs/cloudflare-test.png";

  fs.writeFileSync(outputFile, imageBuffer);

  console.log("========================================");
  console.log("Cloudflare شغال والصورة اتولدت بنجاح.");
  console.log(`مكان الصورة: ${outputFile}`);
  console.log("========================================\n");
} catch (error) {
  console.log("حصلت مشكلة في الاتصال:");
  console.log(error.message);
}